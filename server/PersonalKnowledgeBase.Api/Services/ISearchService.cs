using PersonalKnowledgeBase.Api.DTOs.Search;

namespace PersonalKnowledgeBase.Api.Services;

/// <summary>Full-text search over a user's notes via the SQLite FTS5 index.</summary>
public interface ISearchService
{
    /// <summary>
    /// Executes a phrase search against the <c>notes_fts</c> virtual table, scoped to
    /// the supplied <paramref name="userId"/>. The query string is treated as a phrase
    /// (whitespace-tokenized, inner double quotes doubled) so user input cannot
    /// inject FTS5 operators.
    /// </summary>
    /// <param name="userId">Owning user; only that user's notes are returned.</param>
    /// <param name="q">Raw query. Must already have passed controller-level
    /// validation (non-empty, length 1..200).</param>
    /// <param name="limit">Maximum hits to return (1..100, pre-clamped by the controller).</param>
    /// <param name="offset">Number of hits to skip (0..1000, pre-clamped by the controller).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <exception cref="InvalidOperationException">
    /// Thrown with message <c>SEARCH_ERROR</c> when the underlying FTS5 query fails
    /// (e.g. the index is missing because the migration has not been applied).
    /// </exception>
    Task<SearchResponse> SearchAsync(
        Guid userId,
        string q,
        int limit,
        int offset,
        CancellationToken ct);
}
