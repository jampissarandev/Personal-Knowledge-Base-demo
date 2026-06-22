using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.Data;
using PersonalKnowledgeBase.Api.DTOs.Folders;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Services;

/// <inheritdoc cref="IFolderService"/>
public class FolderService : IFolderService
{
    private readonly AppDbContext _context;
    private readonly ILogger<FolderService> _logger;

    public FolderService(AppDbContext context, ILogger<FolderService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<FolderResponse>> ListAsync(Guid userId, CancellationToken ct)
    {
        return await _context.Folders
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.Name)
            .Select(f => new FolderResponse(
                f.Id,
                f.Name,
                _context.Notes.Count(n => n.FolderId == f.Id && n.UserId == userId),
                f.CreatedAt,
                f.UpdatedAt))
            .ToListAsync(ct);
    }

    public async Task<FolderResponse> CreateAsync(Guid userId, CreateFolderRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var trimmedName = request.Name.Trim();

        var exists = await _context.Folders
            .Where(f => f.UserId == userId && f.Name == trimmedName)
            .AnyAsync(ct);
        if (exists)
        {
            throw new InvalidOperationException("FOLDER_EXISTS");
        }

        var folder = new Folder
        {
            Name = trimmedName,
            UserId = userId
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} folderId={FolderId}",
            "folder_created", userId, folder.Id);

        return new FolderResponse(folder.Id, folder.Name, 0, folder.CreatedAt, folder.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct)
    {
        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId, ct);
        if (folder is null)
        {
            return false;
        }

        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} folderId={FolderId}",
            "folder_deleted", userId, id);

        return true;
    }
}
