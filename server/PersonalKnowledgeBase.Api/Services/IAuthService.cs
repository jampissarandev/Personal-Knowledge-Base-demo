using PersonalKnowledgeBase.Api.DTOs.Auth;

namespace PersonalKnowledgeBase.Api.Services;

/// <summary>
/// Outcome of an auth operation. Carries either a success payload or an error code/message
/// with the HTTP status the controller should return.
/// </summary>
public record AuthResult(AuthResponse? Value, string? ErrorCode, string? ErrorMessage, int StatusCode)
{
    /// <summary>True if the operation succeeded.</summary>
    public bool Succeeded => Value is not null;

    /// <summary>Build a successful result.</summary>
    public static AuthResult Success(AuthResponse value) => new(value, null, null, 200);

    /// <summary>Build a failed result with HTTP status and error code.</summary>
    public static AuthResult Failed(string code, string message, int status) => new(null, code, message, status);
}

public interface IAuthService
{
    /// <summary>Registers a new user and returns a JWT on success.</summary>
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct);

    /// <summary>Validates credentials and returns a JWT on success.</summary>
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct);
}
