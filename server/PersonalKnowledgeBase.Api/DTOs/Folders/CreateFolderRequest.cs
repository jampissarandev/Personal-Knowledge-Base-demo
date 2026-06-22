using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Folders;

/// <summary>Request body for <c>POST /api/folders</c>.</summary>
public record CreateFolderRequest
{
    /// <summary>Folder name; required, max 100 chars. Case-insensitive uniqueness per user.</summary>
    [Required, StringLength(100)]
    public string Name { get; init; } = string.Empty;
}
