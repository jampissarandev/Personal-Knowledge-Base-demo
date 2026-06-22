using System.ComponentModel.DataAnnotations;

namespace PersonalKnowledgeBase.Api.DTOs.Auth;

/// <summary>Request body for <c>POST /api/auth/login</c>.</summary>
public record LoginRequest
{
    /// <summary>User email.</summary>
    [Required, EmailAddress, StringLength(256)]
    public string Email { get; init; } = string.Empty;

    /// <summary>Plaintext password.</summary>
    [Required, StringLength(100)]
    public string Password { get; init; } = string.Empty;
}
