using PersonalKnowledgeBase.Api.DTOs.Notes;

namespace PersonalKnowledgeBase.Api.Services;

/// <summary>Note CRUD + pin operations scoped to a single user.</summary>
public interface INoteService
{
    /// <summary>
    /// Lists notes owned by the user with optional AND-combined filters.
    /// Ordered by <c>IsPinned DESC, UpdatedAt DESC</c>.
    /// </summary>
    Task<IReadOnlyList<NoteResponse>> ListAsync(
        Guid userId,
        Guid? folderId,
        Guid? tagId,
        bool? isPinned,
        int? limit,
        CancellationToken ct);

    /// <summary>
    /// Returns a single note owned by the user, or <c>null</c> when the note
    /// does not exist or is owned by a different user (the two cases are not
    /// distinguished to prevent cross-tenant existence leaks).
    /// </summary>
    Task<NoteResponse?> GetByIdAsync(Guid userId, Guid id, CancellationToken ct);

    /// <summary>
    /// Creates a note. Throws <see cref="InvalidOperationException"/> with message
    /// <c>FOLDER_NOT_FOUND</c> / <c>TAG_NOT_FOUND</c> when a referenced id is
    /// missing or owned by another user, and <c>INVALID_CONTENT_JSON</c> when
    /// <see cref="CreateNoteRequest.ContentJson"/> fails to parse.
    /// </summary>
    Task<NoteResponse> CreateAsync(Guid userId, CreateNoteRequest request, CancellationToken ct);

    /// <summary>
    /// Replaces a note's mutable fields. Returns <c>null</c> when not found or
    /// not owned. Tag list semantics: <c>null</c> keeps existing, empty list
    /// clears all, non-empty list replaces atomically.
    /// </summary>
    Task<NoteResponse?> UpdateAsync(Guid userId, Guid id, UpdateNoteRequest request, CancellationToken ct);

    /// <summary>Deletes a note owned by the user. Returns <c>false</c> when not found.</summary>
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct);

    /// <summary>Toggles the <c>IsPinned</c> flag. Returns <c>null</c> when not found or not owned.</summary>
    Task<NoteResponse?> TogglePinAsync(Guid userId, Guid id, CancellationToken ct);
}
