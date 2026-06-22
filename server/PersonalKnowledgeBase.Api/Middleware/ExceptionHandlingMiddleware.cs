using System.Text.Json;

namespace PersonalKnowledgeBase.Api.Middleware;

/// <summary>
/// Catches unhandled exceptions, logs them via Serilog, and returns a sanitized 500 response.
/// Prevents stack traces and internal details from leaking to clients.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "event={Event} path={Path} method={Method}",
                "unhandled_exception", context.Request.Path, context.Request.Method);

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.Clear();
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";

            var body = JsonSerializer.Serialize(new
            {
                error = new
                {
                    code = "INTERNAL_ERROR",
                    message = "An unexpected error occurred."
                }
            }, JsonOptions);

            await context.Response.WriteAsync(body);
        }
    }
}
