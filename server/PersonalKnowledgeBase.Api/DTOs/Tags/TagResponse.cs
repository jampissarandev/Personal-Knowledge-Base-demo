namespace PersonalKnowledgeBase.Api.DTOs.Tags;

/// <summary>Response body for <c>/api/tags</c> endpoints.</summary>
/// <param name="Id">Tag identifier.</param>
/// <param name="Name">Tag display name.</param>
/// <param name="CreatedAt">UTC creation timestamp.</param>
public record TagResponse(Guid Id, string Name, DateTime CreatedAt);
