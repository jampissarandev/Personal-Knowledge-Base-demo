namespace PersonalKnowledgeBase.Api.DTOs.Notes;

/// <summary>Lightweight tag reference embedded in <see cref="NoteResponse"/>.</summary>
/// <param name="Id">Tag identifier.</param>
/// <param name="Name">Tag display name.</param>
public record TagRef(Guid Id, string Name);
