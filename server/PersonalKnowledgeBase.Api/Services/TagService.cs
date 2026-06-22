using Mapster;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.Data;
using PersonalKnowledgeBase.Api.DTOs.Tags;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Services;

/// <inheritdoc cref="ITagService"/>
public class TagService : ITagService
{
    private readonly AppDbContext _context;
    private readonly ILogger<TagService> _logger;

    public TagService(AppDbContext context, ILogger<TagService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<TagResponse>> ListAsync(Guid userId, CancellationToken ct)
    {
        var tags = await _context.Tags
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        return tags.Adapt<IReadOnlyList<TagResponse>>();
    }

    public async Task<TagResponse> CreateAsync(Guid userId, CreateTagRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var trimmedName = request.Name.Trim();

        var exists = await _context.Tags
            .Where(t => t.UserId == userId && t.Name == trimmedName)
            .AnyAsync(ct);
        if (exists)
        {
            throw new InvalidOperationException("TAG_EXISTS");
        }

        var tag = new Tag
        {
            Name = trimmedName,
            UserId = userId
        };

        _context.Tags.Add(tag);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} tagId={TagId}",
            "tag_created", userId, tag.Id);

        return tag.Adapt<TagResponse>();
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct)
    {
        var tag = await _context.Tags
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId, ct);
        if (tag is null)
        {
            return false;
        }

        _context.Tags.Remove(tag);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} tagId={TagId}",
            "tag_deleted", userId, id);

        return true;
    }
}
