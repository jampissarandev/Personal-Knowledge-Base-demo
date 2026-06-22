namespace PersonalKnowledgeBase.Api.DTOs.Auth;

/// <summary>Public-facing user payload.</summary>
/// <param name="Id">User id.</param>
/// <param name="Email">User email.</param>
/// <param name="DisplayName">Optional display name.</param>
/// <param name="CreatedAt">UTC creation timestamp.</param>
public record UserResponse(Guid Id, string Email, string? DisplayName, DateTime CreatedAt);
