using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.DTOs.Search;
using PersonalKnowledgeBase.Api.Services;

namespace PersonalKnowledgeBase.Api.Controllers;

/// <summary>Full-text search over the caller's notes via SQLite FTS5.</summary>
[ApiController]
[Authorize]
[Route("api/search")]
[Produces("application/json")]
public class SearchController : ControllerBase
{
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;
    private const int MaxOffset = 1000;

    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>
    /// Performs a phrase search over the caller's notes. <c>q</c> is required
    /// (1..200 chars); <c>limit</c> and <c>offset</c> are optional and clamped
    /// to 1..100 and 0..1000 respectively.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SearchResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 500)]
    public async Task<IActionResult> Query(
        [FromQuery, Required, MinLength(1), StringLength(200)] string? q,
        [FromQuery] int? limit,
        [FromQuery] int? offset,
        CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var clampedLimit = limit.HasValue ? Math.Clamp(limit.Value, 1, MaxLimit) : DefaultLimit;
        var clampedOffset = offset.HasValue ? Math.Clamp(offset.Value, 0, MaxOffset) : 0;

        try
        {
            var result = await _searchService.SearchAsync(
                userId.Value,
                q ?? string.Empty,
                clampedLimit,
                clampedOffset,
                ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex) when (ex.Message == "SEARCH_QUERY_TOO_MANY_TOKENS")
        {
            return BadRequest(ErrorResponse.Of(
                "SEARCH_QUERY_TOO_MANY_TOKENS",
                $"Query contains more than {SearchService.FtsMaxPhraseTokens} tokens."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "SEARCH_ERROR")
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                ErrorResponse.Of("SEARCH_ERROR", "Search query failed."));
        }
    }

    private Guid? CurrentUserId
    {
        get
        {
            var raw = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
