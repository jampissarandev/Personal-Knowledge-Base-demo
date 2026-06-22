using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.Data;
using PersonalKnowledgeBase.Api.DTOs.Search;

namespace PersonalKnowledgeBase.Api.Services;

/// <inheritdoc cref="ISearchService"/>
public class SearchService : ISearchService
{
    public const int MaxQueryLength = 200;

    /// <summary>
    /// FTS5's compile-time phrase-token cap. SQLite's <c>FTS5_MAX_PHRASE</c>
    /// defaults to 12 and cannot be raised at runtime; we pre-validate the
    /// whitespace-tokenized count so users get a 400 instead of a sanitized 500
    /// (security review R1).
    /// </summary>
    internal const int FtsMaxPhraseTokens = 12;

    private readonly AppDbContext _context;
    private readonly ILogger<SearchService> _logger;

    public SearchService(AppDbContext context, ILogger<SearchService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<SearchResponse> SearchAsync(
        Guid userId,
        string q,
        int limit,
        int offset,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (q.Length > MaxQueryLength)
        {
            throw new ArgumentException(
                $"q length {q.Length} exceeds MaxQueryLength ({MaxQueryLength}).",
                nameof(q));
        }

        if (CountPhraseTokens(q) > FtsMaxPhraseTokens)
        {
            throw new InvalidOperationException("SEARCH_QUERY_TOO_MANY_TOKENS");
        }

        var quotedQuery = QuoteAsPhrase(q);
        var qLength = q.Length;
        var qHash = ComputeShortHash(q);
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var connection = (SqliteConnection)_context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync(ct);
            }

            await using var countCmd = connection.CreateCommand();
            countCmd.CommandText = @"
                SELECT COUNT(*)
                FROM notes_fts
                JOIN Notes n ON n.rowid = notes_fts.rowid
                WHERE notes_fts MATCH $q
                  AND n.UserId = $userId";
            countCmd.Parameters.AddWithValue("$q", quotedQuery);
            countCmd.Parameters.AddWithValue("$userId", userId);
            var totalScalar = await countCmd.ExecuteScalarAsync(ct);
            var total = totalScalar is null or DBNull ? 0 : Convert.ToInt32(totalScalar);

            var rows = new List<FtsSearchRow>();
            if (total > 0)
            {
                await using var rowsCmd = connection.CreateCommand();
                rowsCmd.CommandText = @"
                    SELECT
                        n.Id           AS Id,
                        n.Title        AS Title,
                        snippet(notes_fts, 1, '<mark>', '</mark>', '...', 32) AS Snippet
                    FROM notes_fts
                    JOIN Notes n ON n.rowid = notes_fts.rowid
                    WHERE notes_fts MATCH $q
                      AND n.UserId = $userId
                    ORDER BY bm25(notes_fts) ASC
                    LIMIT $limit OFFSET $offset";
                rowsCmd.Parameters.AddWithValue("$q", quotedQuery);
                rowsCmd.Parameters.AddWithValue("$userId", userId);
                rowsCmd.Parameters.AddWithValue("$limit", limit);
                rowsCmd.Parameters.AddWithValue("$offset", offset);

                await using var reader = await rowsCmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    rows.Add(new FtsSearchRow
                    {
                        Id = reader.GetGuid(0),
                        Title = reader.GetString(1),
                        Snippet = reader.IsDBNull(2) ? string.Empty : reader.GetString(2)
                    });
                }
            }

            stopwatch.Stop();

            var hits = rows
                .Select(r => new SearchHit(r.Id, r.Title, r.Snippet))
                .ToList();

            _logger.LogInformation(
                "event={Event} userId={UserId} qLength={QLength} qHash={QHash} resultCount={ResultCount} total={Total} elapsedMs={ElapsedMs}",
                "search_query", userId, qLength, qHash, hits.Count, total, stopwatch.ElapsedMilliseconds);

            return new SearchResponse(q, total, hits);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "event={Event} userId={UserId} qLength={QLength} qHash={QHash} elapsedMs={ElapsedMs}",
                "search_error", userId, qLength, qHash, stopwatch.ElapsedMilliseconds);
            throw new InvalidOperationException("SEARCH_ERROR", ex);
        }
    }

    /// <summary>
    /// Wraps the user query as an FTS5 phrase search, escaping any inner double quotes
    /// by doubling them. This is the strategy mandated by <c>docs/PHASE3_PLAN.md</c> §3
    /// step A "Query syntax handling" and prevents FTS5 operator injection.
    /// </summary>
    private static string QuoteAsPhrase(string q)
    {
        var escaped = q.Replace("\"", "\"\"");
        return $"\"{escaped}\"";
    }

    private static int CountPhraseTokens(string q)
    {
        int count = 0;
        bool inToken = false;
        foreach (var c in q)
        {
            if (char.IsWhiteSpace(c))
            {
                inToken = false;
            }
            else if (!inToken)
            {
                inToken = true;
                count++;
            }
        }
        return count;
    }

    private static string ComputeShortHash(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash, 0, 4);
    }

    private sealed class FtsSearchRow
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Snippet { get; set; } = string.Empty;
    }
}
