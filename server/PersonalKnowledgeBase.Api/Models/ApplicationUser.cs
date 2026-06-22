using Microsoft.AspNetCore.Identity;

namespace PersonalKnowledgeBase.Api.Models;

/// <summary>
/// Application user extending ASP.NET Core Identity with display name and audit timestamp.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>Optional display name shown in the UI; not used for login.</summary>
    public string? DisplayName { get; set; }

    /// <summary>UTC timestamp when the account was created.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Navigation to the user's notes.</summary>
    public ICollection<Note> Notes { get; set; } = [];

    /// <summary>Navigation to the user's tags.</summary>
    public ICollection<Tag> Tags { get; set; } = [];

    /// <summary>Navigation to the user's folders.</summary>
    public ICollection<Folder> Folders { get; set; } = [];
}
