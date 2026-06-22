namespace PersonalKnowledgeBase.Api.DTOs.Folders;

/// <summary>Response body for <c>/api/folders</c> endpoints.</summary>
/// <param name="Id">Folder identifier.</param>
/// <param name="Name">Folder display name.</param>
/// <param name="NoteCount">Number of notes currently filed in this folder.</param>
/// <param name="CreatedAt">UTC creation timestamp.</param>
/// <param name="UpdatedAt">UTC last-update timestamp.</param>
public record FolderResponse(
    Guid Id,
    string Name,
    int NoteCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);
