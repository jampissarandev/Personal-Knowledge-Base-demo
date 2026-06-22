namespace PersonalKnowledgeBase.Api.Models;

/// <summary>
/// A single note owned by a user. Content is stored in two forms:
/// JSON for editor round-tripping and plain text for full-text search indexing.
/// </summary>
public class Note
{
    /// <summary>Primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Note title; required, max 200 chars.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Editor content as TipTap JSON. Default <c>"{{}}"</c>.</summary>
    public string ContentJson { get; set; } = "{}";

    /// <summary>Plain-text projection of <see cref="ContentJson"/>; used for FTS5 indexing.</summary>
    public string ContentText { get; set; } = string.Empty;

    /// <summary>If true, this note floats to the top of the user's list.</summary>
    public bool IsPinned { get; set; }

    /// <summary>Foreign key to the owning <see cref="ApplicationUser"/>.</summary>
    public Guid UserId { get; set; }

    /// <summary>Optional foreign key to a <see cref="Folder"/>; null when the note is unfiled.</summary>
    public Guid? FolderId { get; set; }

    /// <summary>UTC timestamp when the note was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp of the last edit.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Navigation to the owning user.</summary>
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Navigation to the containing folder; null when unfiled.</summary>
    public Folder? Folder { get; set; }

    /// <summary>Junction rows linking this note to <see cref="Tag"/>s.</summary>
    public ICollection<NoteTag> NoteTags { get; set; } = [];
}
