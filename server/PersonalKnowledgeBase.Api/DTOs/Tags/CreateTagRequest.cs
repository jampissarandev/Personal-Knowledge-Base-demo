using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Tags;

/// <summary>Request body for <c>POST /api/tags</c>.</summary>
public record CreateTagRequest
{
    /// <summary>Tag name; required, max 50 chars. Case-insensitive uniqueness per user.</summary>
    [Required, StringLength(50)]
    public string Name { get; init; } = string.Empty;
}
