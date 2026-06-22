using System.Text.Json;
using Mapster;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.Data;
using PersonalKnowledgeBase.Api.DTOs.Notes;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Services;

/// <inheritdoc cref="INoteService"/>
public class NoteService : INoteService
{
    private readonly AppDbContext _context;
    private readonly ILogger<NoteService> _logger;

    public NoteService(AppDbContext context, ILogger<NoteService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<NoteResponse>> ListAsync(
        Guid userId,
        Guid? folderId,
        Guid? tagId,
        bool? isPinned,
        int? limit,
        bool? unfiled,
        CancellationToken ct)
    {
        var query = _context.Notes
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unfiled.HasValue && unfiled.Value)
        {
            query = query.Where(n => n.FolderId == null);
        }
        else if (folderId.HasValue)
        {
            query = query.Where(n => n.FolderId == folderId.Value);
        }
        if (tagId.HasValue)
        {
            query = query.Where(n => n.NoteTags.Any(nt => nt.TagId == tagId.Value));
        }
        if (isPinned.HasValue)
        {
            query = query.Where(n => n.IsPinned == isPinned.Value);
        }

        var notes = await query
            .Include(n => n.Folder)
            .Include(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.UpdatedAt)
            .Take(Math.Min(limit ?? 200, 200))
            .ToListAsync(ct);

        return notes.Adapt<IReadOnlyList<NoteResponse>>();
    }

    public async Task<NoteResponse?> GetByIdAsync(Guid userId, Guid id, CancellationToken ct)
    {
        var note = await _context.Notes
            .AsNoTracking()
            .Include(n => n.Folder)
            .Include(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);

        return note?.Adapt<NoteResponse>();
    }

    public async Task<NoteResponse> CreateAsync(Guid userId, CreateNoteRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var contentText = ResolveContentText(request.ContentJson, request.ContentText);

        string? folderName = null;
        if (request.FolderId.HasValue)
        {
            var folder = await _context.Folders
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == request.FolderId.Value && f.UserId == userId, ct);
            if (folder is null)
            {
                throw new InvalidOperationException("FOLDER_NOT_FOUND");
            }
            folderName = folder.Name;
        }

        var tagRefs = await ResolveTagRefsAsync(userId, request.TagIds, ct);

        var now = DateTime.UtcNow;
        var note = new Note
        {
            Title = request.Title.Trim(),
            ContentJson = request.ContentJson,
            ContentText = contentText,
            IsPinned = request.IsPinned,
            UserId = userId,
            FolderId = request.FolderId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync(ct);

        if (tagRefs.Count > 0)
        {
            foreach (var tagRef in tagRefs)
            {
                _context.NoteTags.Add(new NoteTag { NoteId = note.Id, TagId = tagRef.Id });
            }
            await _context.SaveChangesAsync(ct);
        }

        _logger.LogInformation(
            "event={Event} userId={UserId} noteId={NoteId}",
            "note_created", userId, note.Id);

        return new NoteResponse(
            note.Id,
            note.Title,
            note.ContentJson,
            note.ContentText,
            note.IsPinned,
            note.FolderId,
            folderName,
            tagRefs,
            note.CreatedAt,
            note.UpdatedAt);
    }

    public async Task<NoteResponse?> UpdateAsync(Guid userId, Guid id, UpdateNoteRequest request, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        var note = await _context.Notes
            .Include(n => n.Folder)
            .Include(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (note is null)
        {
            return null;
        }

        var contentText = ResolveContentText(request.ContentJson, request.ContentText);

        Folder? folder = null;
        if (request.FolderId.HasValue)
        {
            folder = await _context.Folders
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Id == request.FolderId.Value && f.UserId == userId, ct);
            if (folder is null)
            {
                throw new InvalidOperationException("FOLDER_NOT_FOUND");
            }
        }

        IReadOnlyList<TagRef> tagRefs = Array.Empty<TagRef>();
        if (request.TagIds is not null)
        {
            tagRefs = await ResolveTagRefsAsync(userId, request.TagIds, ct);

            _context.NoteTags.RemoveRange(note.NoteTags);
            foreach (var tagRef in tagRefs)
            {
                _context.NoteTags.Add(new NoteTag { NoteId = note.Id, TagId = tagRef.Id });
            }
        }
        else
        {
            tagRefs = note.NoteTags
                .Select(nt => new TagRef(nt.Tag.Id, nt.Tag.Name))
                .ToList();
        }

        note.Title = request.Title.Trim();
        note.ContentJson = request.ContentJson;
        note.ContentText = contentText;
        note.IsPinned = request.IsPinned;
        note.FolderId = request.FolderId;
        note.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} noteId={NoteId}",
            "note_updated", userId, note.Id);

        var folderName = folder?.Name;

        return new NoteResponse(
            note.Id,
            note.Title,
            note.ContentJson,
            note.ContentText,
            note.IsPinned,
            note.FolderId,
            folderName,
            tagRefs,
            note.CreatedAt,
            note.UpdatedAt);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken ct)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (note is null)
        {
            return false;
        }

        _context.Notes.Remove(note);
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} noteId={NoteId}",
            "note_deleted", userId, id);

        return true;
    }

    public async Task<NoteResponse?> TogglePinAsync(Guid userId, Guid id, CancellationToken ct)
    {
        var note = await _context.Notes
            .Include(n => n.Folder)
            .Include(n => n.NoteTags).ThenInclude(nt => nt.Tag)
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (note is null)
        {
            return null;
        }

        note.IsPinned = !note.IsPinned;
        note.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        _logger.LogInformation(
            "event={Event} userId={UserId} noteId={NoteId} isPinned={IsPinned}",
            "note_pin_toggled", userId, note.Id, note.IsPinned);

        return note.Adapt<NoteResponse>();
    }

    private async Task<IReadOnlyList<TagRef>> ResolveTagRefsAsync(
        Guid userId,
        IReadOnlyList<Guid>? tagIds,
        CancellationToken ct)
    {
        if (tagIds is null || tagIds.Count == 0)
        {
            return Array.Empty<TagRef>();
        }

        var distinctIds = tagIds.Distinct().ToList();
        var tagRefs = await _context.Tags
            .AsNoTracking()
            .Where(t => t.UserId == userId && distinctIds.Contains(t.Id))
            .Select(t => new TagRef(t.Id, t.Name))
            .ToListAsync(ct);

        if (tagRefs.Count != distinctIds.Count)
        {
            throw new InvalidOperationException("TAG_NOT_FOUND");
        }

        return tagRefs;
    }

    private static string ResolveContentText(string contentJson, string? providedText)
    {
        string derived;
        try
        {
            using var doc = JsonDocument.Parse(contentJson);
            derived = DerivePlainText(doc.RootElement);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("INVALID_CONTENT_JSON");
        }

        return string.IsNullOrWhiteSpace(providedText) ? derived : providedText;
    }

    private static string DerivePlainText(JsonElement element)
    {
        var segments = new List<string>();
        CollectText(element, segments);
        return string.Join("\n", segments);
    }

    private static void CollectText(JsonElement element, List<string> segments)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.TryGetProperty("text", out var textProp)
                    && textProp.ValueKind == JsonValueKind.String)
                {
                    var s = textProp.GetString();
                    if (!string.IsNullOrEmpty(s))
                    {
                        segments.Add(s);
                    }
                    return;
                }
                if (element.TryGetProperty("content", out var contentProp)
                    && contentProp.ValueKind == JsonValueKind.Array)
                {
                    foreach (var child in contentProp.EnumerateArray())
                    {
                        CollectText(child, segments);
                    }
                }
                break;
            case JsonValueKind.Array:
                foreach (var child in element.EnumerateArray())
                {
                    CollectText(child, segments);
                }
                break;
        }
    }
}
