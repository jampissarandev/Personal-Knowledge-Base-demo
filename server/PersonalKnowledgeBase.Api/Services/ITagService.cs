using PersonalKnowledgeBase.Api.DTOs.Tags;

namespace PersonalKnowledgeBase.Api.Services;

/// <summary>Tag CRUD operations scoped to a single user.</summary>
public interface ITagService
{
    /// <summary>Lists all tags owned by the user, ordered by name.</summary>
    Task<IReadOnlyList<TagResponse>> ListAsync(Guid userId, CancellationToken ct);

    /// <summary>
    /// Creates a new tag. Throws <see cref="InvalidOperationException"/> with message
    /// <c>TAG_EXISTS</c> when a tag with the same (trimmed, case-insensitive) name
    /// already exists for the user.
    /// </summary>
    Task<TagResponse> CreateAsync(Guid userId, CreateTagRequest request, CancellationToken ct);

    /// <summary>Deletes a tag owned by the user. Returns <c>false</c> when not found.</summary>
    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct);
}
