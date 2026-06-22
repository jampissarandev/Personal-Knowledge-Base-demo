using PersonalKnowledgeBase.Api.DTOs.Folders;

namespace PersonalKnowledgeBase.Api.Services;

/// <summary>Folder CRUD operations scoped to a single user.</summary>
public interface IFolderService
{
    /// <summary>Lists all folders owned by the user, ordered by name, with note counts.</summary>
    Task<IReadOnlyList<FolderResponse>> ListAsync(Guid userId, CancellationToken ct);

    /// <summary>
    /// Creates a new folder. Throws <see cref="InvalidOperationException"/> with message
    /// <c>FOLDER_EXISTS</c> when a folder with the same (trimmed, case-insensitive) name
    /// already exists for the user.
    /// </summary>
    Task<FolderResponse> CreateAsync(Guid userId, CreateFolderRequest request, CancellationToken ct);

    /// <summary>
    /// Deletes a folder owned by the user. The schema cascades with
    /// <c>OnDelete(SetNull)</c> on <c>Note.FolderId</c>, so contained notes
    /// become unfiled automatically. Returns <c>false</c> when not found.
    /// </summary>
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct);
}
