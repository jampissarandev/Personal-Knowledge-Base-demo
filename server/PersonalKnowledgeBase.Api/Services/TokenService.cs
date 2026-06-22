using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Services;

public interface ITokenService
{
    /// <summary>Generates a signed JWT for the given user.</summary>
    /// <param name="user">The authenticated user.</param>
    /// <returns>The serialized JWT and its UTC expiry timestamp.</returns>
    Task<(string Token, DateTime ExpiresAt)> GenerateTokenAsync(ApplicationUser user);
}

/// <inheritdoc cref="ITokenService"/>
public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<(string Token, DateTime ExpiresAt)> GenerateTokenAsync(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var issuer = jwtSettings["Issuer"]
            ?? throw new InvalidOperationException("JwtSettings:Issuer is not configured.");
        var audience = jwtSettings["Audience"]
            ?? throw new InvalidOperationException("JwtSettings:Audience is not configured.");
        var key = jwtSettings["Key"]
            ?? throw new InvalidOperationException("JwtSettings:Key is not configured.");
        var expiryDays = int.TryParse(jwtSettings["ExpiryInDays"], out var days) ? days : 7;

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddDays(expiryDays);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        var serialized = new JwtSecurityTokenHandler().WriteToken(token);
        return Task.FromResult((serialized, expiresAt));
    }
}
