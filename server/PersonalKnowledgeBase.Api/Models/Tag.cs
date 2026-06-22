namespace PersonalKnowledgeBase.Api.Models;

/// <summary>
/// A user-defined tag for cross-cutting note classification. Tags are exclusive to a single user.
/// </summary>
public class Tag
{
    /// <summary>Primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Display name of the tag; required, max 50 chars.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Foreign key to the owning <see cref="ApplicationUser"/>.</summary>
    public Guid UserId { get; set; }

    /// <summary>UTC timestamp when the tag was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Navigation to the owning user.</summary>
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Junction rows linking this tag to <see cref="Note"/>s.</summary>
    public ICollection<NoteTag> NoteTags { get; set; } = [];
}
