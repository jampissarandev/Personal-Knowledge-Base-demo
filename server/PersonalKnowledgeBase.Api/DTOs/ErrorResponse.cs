namespace PersonalKnowledgeBase.Api.DTOs;

/// <summary>
/// Standard error envelope returned by all error responses.
/// </summary>
/// <param name="Code">Machine-readable error code (e.g. <c>VALIDATION_ERROR</c>).</param>
/// <param name="Message">Human-readable error message.</param>
/// <param name="Details">Optional structured details (validation field errors, etc.).</param>
public record ErrorResponse(ErrorBody Error)
{
    public static ErrorResponse Of(string code, string message, object? details = null)
        => new(new ErrorBody(code, message, details));
}

/// <summary>Error body payload.</summary>
public record ErrorBody(string Code, string Message, object? Details);
