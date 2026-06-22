using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.DTOs.Notes;
using PersonalKnowledgeBase.Api.Services;

namespace PersonalKnowledgeBase.Api.Controllers;

/// <summary>Note CRUD plus pin toggle.</summary>
[ApiController]
[Authorize]
[Route("api/notes")]
[Produces("application/json")]
public class NotesController : ControllerBase
{
    private readonly INoteService _noteService;

    public NotesController(INoteService noteService)
    {
        _noteService = noteService;
    }

    /// <summary>Lists notes for the caller, optionally filtered by <c>folderId</c>, <c>tagId</c>, <c>isPinned</c>.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<NoteResponse>), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    public async Task<IActionResult> List(
        [FromQuery] Guid? folderId,
        [FromQuery] Guid? tagId,
        [FromQuery] bool? isPinned,
        [FromQuery] int? limit,
        CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var clampedLimit = limit.HasValue ? Math.Clamp(limit.Value, 1, 200) : (int?)null;
        var notes = await _noteService.ListAsync(userId.Value, folderId, tagId, isPinned, clampedLimit, ct);
        return Ok(notes);
    }

    /// <summary>Returns a single note by id. <c>404</c> when missing or not owned.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(NoteResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var note = await _noteService.GetByIdAsync(userId.Value, id, ct);
        if (note is null)
        {
            return NotFound(ErrorResponse.Of("NOTE_NOT_FOUND", "Note not found."));
        }

        return Ok(note);
    }

    /// <summary>Creates a new note. Returns <c>201</c> with <c>Location</c> header.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(NoteResponse), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> Create([FromBody] CreateNoteRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        try
        {
            var note = await _noteService.CreateAsync(userId.Value, request, ct);
            return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
        }
        catch (InvalidOperationException ex) when (ex.Message == "FOLDER_NOT_FOUND")
        {
            return NotFound(ErrorResponse.Of("FOLDER_NOT_FOUND", "Referenced folder not found."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "TAG_NOT_FOUND")
        {
            return NotFound(ErrorResponse.Of("TAG_NOT_FOUND", "Referenced tag not found."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "INVALID_CONTENT_JSON")
        {
            return BadRequest(ErrorResponse.Of("INVALID_CONTENT_JSON", "ContentJson is not valid JSON."));
        }
    }

    /// <summary>Replaces a note. <c>404</c> when missing or not owned.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(NoteResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNoteRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        try
        {
            var note = await _noteService.UpdateAsync(userId.Value, id, request, ct);
            if (note is null)
            {
                return NotFound(ErrorResponse.Of("NOTE_NOT_FOUND", "Note not found."));
            }
            return Ok(note);
        }
        catch (InvalidOperationException ex) when (ex.Message == "FOLDER_NOT_FOUND")
        {
            return NotFound(ErrorResponse.Of("FOLDER_NOT_FOUND", "Referenced folder not found."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "TAG_NOT_FOUND")
        {
            return NotFound(ErrorResponse.Of("TAG_NOT_FOUND", "Referenced tag not found."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "INVALID_CONTENT_JSON")
        {
            return BadRequest(ErrorResponse.Of("INVALID_CONTENT_JSON", "ContentJson is not valid JSON."));
        }
    }

    /// <summary>Deletes a note. <c>204</c> on success, <c>404</c> when missing.</summary>
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

        var deleted = await _noteService.DeleteAsync(userId.Value, id, ct);
        if (!deleted)
        {
            return NotFound(ErrorResponse.Of("NOTE_NOT_FOUND", "Note not found."));
        }

        return NoContent();
    }

    /// <summary>Toggles the <c>IsPinned</c> flag.</summary>
    [HttpPatch("{id:guid}/pin")]
    [ProducesResponseType(typeof(NoteResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> TogglePin(Guid id, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var note = await _noteService.TogglePinAsync(userId.Value, id, ct);
        if (note is null)
        {
            return NotFound(ErrorResponse.Of("NOTE_NOT_FOUND", "Note not found."));
        }

        return Ok(note);
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
