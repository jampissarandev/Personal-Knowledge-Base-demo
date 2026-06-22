namespace PersonalKnowledgeBase.Api.DTOs.Auth;

/// <summary>Response body for register/login endpoints.</summary>
/// <param name="Token">Signed JWT access token.</param>
/// <param name="ExpiresAt">UTC timestamp when the token expires.</param>
/// <param name="User">Authenticated user profile.</param>
public record AuthResponse(string Token, DateTime ExpiresAt, UserResponse User);
