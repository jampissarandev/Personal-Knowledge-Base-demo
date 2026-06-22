using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Auth;

/// <summary>Request body for <c>POST /api/auth/register</c>.</summary>
public record RegisterRequest
{
    /// <summary>User email; used as the login identifier.</summary>
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    /// <summary>Plaintext password; min 8 chars, max 100.</summary>
    [Required, MinLength(8), StringLength(100)]
    public string Password { get; init; } = string.Empty;

    /// <summary>Optional display name; max 100 chars.</summary>
    [StringLength(100)]
    public string? DisplayName { get; init; }
}
