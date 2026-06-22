using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PersonalKnowledgeBase.Api.DTOs;
using PersonalKnowledgeBase.Api.DTOs.Auth;
using PersonalKnowledgeBase.Api.Models;
using PersonalKnowledgeBase.Api.Services;

namespace PersonalKnowledgeBase.Api.Controllers;

/// <summary>Authentication endpoints: register, login, and current-user lookup.</summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        UserManager<ApplicationUser> userManager,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>Registers a new user account.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 409)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(BuildValidationError());
        }

        var result = await _authService.RegisterAsync(request, ct);
        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode,
                ErrorResponse.Of(result.ErrorCode!, result.ErrorMessage!));
        }

        return Ok(result.Value);
    }

    /// <summary>Authenticates a user and returns a JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 400)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(BuildValidationError());
        }

        var result = await _authService.LoginAsync(request, ct);
        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode,
                ErrorResponse.Of(result.ErrorCode!, result.ErrorMessage!));
        }

        return Ok(result.Value);
    }

    /// <summary>Returns the current authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserResponse), 200)]
    [ProducesResponseType(typeof(ErrorResponse), 401)]
    [ProducesResponseType(typeof(ErrorResponse), 404)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ErrorResponse.Of("UNAUTHORIZED", "Authentication required."));
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(ErrorResponse.Of("USER_NOT_FOUND", "User not found."));
        }

        return Ok(new UserResponse(user.Id, user.Email ?? string.Empty, user.DisplayName, user.CreatedAt));
    }

    private ErrorResponse BuildValidationError()
    {
        var errors = ModelState
            .Where(kvp => kvp.Value?.Errors.Count > 0)
            .ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

        return ErrorResponse.Of("VALIDATION_ERROR", "Request validation failed.", errors);
    }
}
