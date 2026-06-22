namespace PersonalKnowledgeBase.Api.DTOs.Search;

/// <summary>Response body for <c>GET /api/search</c>.</summary>
/// <param name="Q">The query string that produced these results (echoed for client convenience).</param>
/// <param name="Total">Total number of matches for the query, ignoring <c>limit</c> / <c>offset</c>.</param>
/// <param name="Hits">Page of matches, ordered by FTS5 <c>bm25</c> relevance (best first).</param>
public record SearchResponse(
    string Q,
    int Total,
    IReadOnlyList<SearchHit> Hits);
