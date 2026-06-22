using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Notes;

/// <summary>Request body for <c>PUT /api/notes/{id}</c>.</summary>
public record UpdateNoteRequest
{
    /// <summary>Note title; required, max 200 chars, must not be blank.</summary>
    [Required, StringLength(200), MinLength(1)]
    public string Title { get; init; } = string.Empty;

    /// <summary>Editor content as JSON. Must be valid JSON; validated server-side.</summary>
    [Required, StringLength(262144)]
    public string ContentJson { get; init; } = "{}";

    /// <summary>
    /// Optional pre-computed plain-text projection. When omitted the service derives
    /// it from <see cref="ContentJson"/>.
    /// </summary>
    [StringLength(262144)]
    public string? ContentText { get; init; }

    /// <summary>Whether the note is pinned.</summary>
    public bool IsPinned { get; init; }

    /// <summary>Optional folder id; pass <c>null</c> to unfile. Must be owned by the caller when set.</summary>
    public Guid? FolderId { get; init; }

    /// <summary>
    /// Tag ids to apply. <c>null</c> keeps the existing set; an empty list clears all tags;
    /// a non-empty list replaces atomically.
    /// </summary>
    public IReadOnlyList<Guid>? TagIds { get; init; }
}
