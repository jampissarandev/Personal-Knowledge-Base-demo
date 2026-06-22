using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.DTOs.Tags;
using PersonalKnowledgeBase.Api.Services;

namespace PersonalKnowledgeBase.Api.Controllers;

/// <summary>Tag CRUD endpoints.</summary>
[ApiController]
[Authorize]
[Route("api/tags")]
[Produces("application/json")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    /// <summary>Lists all tags owned by the caller, ordered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TagResponse>), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var tags = await _tagService.ListAsync(userId.Value, ct);
        return Ok(tags);
    }

    /// <summary>Creates a new tag. Returns <c>409 TAG_EXISTS</c> on duplicate.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TagResponse), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 409)]
    public async Task<IActionResult> Create([FromBody] CreateTagRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        try
        {
            var tag = await _tagService.CreateAsync(userId.Value, request, ct);
            return CreatedAtAction(nameof(List), new { id = tag.Id }, tag);
        }
        catch (DbUpdateException)
        {
            return Conflict(ErrorResponse.Of("TAG_EXISTS", "A tag with that name already exists."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "TAG_EXISTS")
        {
            return Conflict(ErrorResponse.Of("TAG_EXISTS", "A tag with that name already exists."));
        }
    }

    /// <summary>Deletes a tag. Returns <c>204</c> on success, <c>404</c> when missing.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var deleted = await _tagService.DeleteAsync(userId.Value, id, ct);
        if (!deleted)
        {
            return NotFound(ErrorResponse.Of("TAG_NOT_FOUND", "Tag not found."));
        }

        return NoContent();
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
