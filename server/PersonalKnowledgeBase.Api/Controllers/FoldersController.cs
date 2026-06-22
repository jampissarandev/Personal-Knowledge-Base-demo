using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.DTOs.Folders;
using PersonalKnowledgeBase.Api.Services;

namespace PersonalKnowledgeBase.Api.Controllers;

/// <summary>Folder CRUD endpoints.</summary>
[ApiController]
[Authorize]
[Route("api/folders")]
[Produces("application/json")]
public class FoldersController : ControllerBase
{
    private readonly IFolderService _folderService;

    public FoldersController(IFolderService folderService)
    {
        _folderService = folderService;
    }

    /// <summary>Lists all folders owned by the caller, ordered by name, with note counts.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<FolderResponse>), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var folders = await _folderService.ListAsync(userId.Value, ct);
        return Ok(folders);
    }

    /// <summary>Creates a new folder. Returns <c>409 FOLDER_EXISTS</c> on duplicate.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(FolderResponse), 201)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 409)]
    public async Task<IActionResult> Create([FromBody] CreateFolderRequest request, CancellationToken ct)
    {
        var userId = CurrentUserId;
        if (userId is null)
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        try
        {
            var folder = await _folderService.CreateAsync(userId.Value, request, ct);
            return CreatedAtAction(nameof(List), new { id = folder.Id }, folder);
        }
        catch (DbUpdateException)
        {
            return Conflict(ErrorResponse.Of("FOLDER_EXISTS", "A folder with that name already exists."));
        }
        catch (InvalidOperationException ex) when (ex.Message == "FOLDER_EXISTS")
        {
            return Conflict(ErrorResponse.Of("FOLDER_EXISTS", "A folder with that name already exists."));
        }
    }

    /// <summary>Deletes a folder. Notes within it become unfiled via <c>OnDelete(SetNull)</c>.</summary>
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

        var deleted = await _folderService.DeleteAsync(userId.Value, id, ct);
        if (!deleted)
        {
            return NotFound(ErrorResponse.Of("FOLDER_NOT_FOUND", "Folder not found."));
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
