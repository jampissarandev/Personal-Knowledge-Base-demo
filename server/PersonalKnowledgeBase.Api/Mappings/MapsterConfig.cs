using Mapster;
using PersonalKnowledgeBase.Api.DTOs.Folders;
using PersonalKnowledgeBase.Api.DTOs.Notes;
using PersonalKnowledgeBase.Api.DTOs.Tags;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Mappings;

/// <summary>
/// Centralised Mapster type-adapter registrations. Called once at startup
/// from <c>Program.cs</c> before <c>builder.Build()</c>.
/// </summary>
public static class MapsterConfig
{
    public static void Register()
    {
        TypeAdapterConfig<Tag, TagResponse>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.CreatedAt, src => src.CreatedAt);

        TypeAdapterConfig<Folder, FolderResponse>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.NoteCount, src => src.Notes.Count)
            .Map(dest => dest.CreatedAt, src => src.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.UpdatedAt);

        TypeAdapterConfig<Note, NoteResponse>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Title, src => src.Title)
            .Map(dest => dest.ContentJson, src => src.ContentJson)
            .Map(dest => dest.ContentText, src => src.ContentText)
            .Map(dest => dest.IsPinned, src => src.IsPinned)
            .Map(dest => dest.FolderId, src => src.FolderId)
            .Map(dest => dest.FolderName, src => src.Folder == null ? null : src.Folder.Name)
            .Map(dest => dest.Tags, src => src.NoteTags
                .Select(nt => new TagRef(nt.Tag.Id, nt.Tag.Name))
                .ToList())
            .Map(dest => dest.CreatedAt, src => src.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.UpdatedAt);
    }
}
