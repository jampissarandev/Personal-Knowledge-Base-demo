namespace PersonalKnowledgeBase.Api.DTOs.Notes;

/// <summary>Full note payload returned by every <c>/api/notes</c> endpoint.</summary>
/// <param name="Id">Note identifier.</param>
/// <param name="Title">Note title.</param>
/// <param name="ContentJson">Editor JSON (TipTap) for round-tripping.</param>
/// <param name="ContentText">Plain-text projection used for FTS5 indexing (Phase 3).</param>
/// <param name="IsPinned">Whether the note is pinned to the top of the list.</param>
/// <param name="FolderId">Containing folder id, or <c>null</c> when unfiled.</param>
/// <param name="FolderName">Containing folder name, or <c>null</c> when unfiled.</param>
/// <param name="Tags">Tags attached to this note.</param>
/// <param name="CreatedAt">UTC creation timestamp.</param>
/// <param name="UpdatedAt">UTC last-edit timestamp.</param>
public record NoteResponse(
    Guid Id,
    string Title,
    string ContentJson,
    string ContentText,
    bool IsPinned,
    Guid? FolderId,
    string? FolderName,
    IReadOnlyList<TagRef> Tags,
    DateTime CreatedAt,
    DateTime UpdatedAt);
