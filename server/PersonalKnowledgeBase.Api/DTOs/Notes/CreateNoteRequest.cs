using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Notes;

/// <summary>Request body for <c>POST /api/notes</c>.</summary>
public record CreateNoteRequest
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

    /// <summary>Whether to pin the new note.</summary>
    public bool IsPinned { get; init; }

    /// <summary>Optional folder id; must be owned by the caller when set.</summary>
    public Guid? FolderId { get; init; }

    /// <summary>Optional tag ids; each must be owned by the caller when set.</summary>
    public IReadOnlyList<Guid>? TagIds { get; init; }
}
