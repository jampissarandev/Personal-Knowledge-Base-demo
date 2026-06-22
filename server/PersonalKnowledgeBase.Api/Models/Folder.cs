namespace PersonalKnowledgeBase.Api.Models;

/// <summary>
/// A user-defined folder for organizing notes. Folders are exclusive to a single user.
/// </summary>
public class Folder
{
    /// <summary>Primary key.</summary>
    public Guid Id { get; set; }

    /// <summary>Display name of the folder; required, max 100 chars.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Foreign key to the owning <see cref="ApplicationUser"/>.</summary>
    public Guid UserId { get; set; }

    /// <summary>UTC timestamp when the folder was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>UTC timestamp of the last update.</summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Navigation to the owning user.</summary>
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Notes contained in this folder (may be empty).</summary>
    public ICollection<Note> Notes { get; set; } = [];
}
