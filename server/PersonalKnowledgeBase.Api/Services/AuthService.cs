using Microsoft.AspNetCore.Identity;
using PersonalKnowledgeBase.Api.DTOs.Auth;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            _logger.LogWarning("event={Event} email={Email} message=\"email already registered\"",
                "registration_conflict", request.Email);
            return AuthResult.Failed("EMAIL_TAKEN", "Email already registered.", 409);
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("event={Event} email={Email} errors={Errors}",
                "registration_failed", request.Email, errors);
            return AuthResult.Failed("REGISTRATION_FAILED", errors, 400);
        }

        var (token, expiresAt) = await _tokenService.GenerateTokenAsync(user);
        _logger.LogInformation("event={Event} userId={UserId} email={Email}",
            "user_registered", user.Id, user.Email);

        var response = new AuthResponse(
            token,
            expiresAt,
            new UserResponse(user.Id, user.Email ?? string.Empty, user.DisplayName, user.CreatedAt));
        return AuthResult.Success(response);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            _logger.LogWarning("event={Event} email={Email} reason=\"user not found\"",
                "user_login_failed", request.Email);
            return AuthResult.Failed("INVALID_CREDENTIALS", "Invalid email or password.", 401);
        }

        var signInResult = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!signInResult.Succeeded)
        {
            _logger.LogWarning("event={Event} userId={UserId} reason=\"{Reason}\"",
                "user_login_failed", user.Id, signInResult.ToString());
            return AuthResult.Failed("INVALID_CREDENTIALS", "Invalid email or password.", 401);
        }

        var (token, expiresAt) = await _tokenService.GenerateTokenAsync(user);
        _logger.LogInformation("event={Event} userId={UserId} email={Email}",
            "user_login", user.Id, user.Email);

        var response = new AuthResponse(
            token,
            expiresAt,
            new UserResponse(user.Id, user.Email ?? string.Empty, user.DisplayName, user.CreatedAt));
        return AuthResult.Success(response);
    }
}
