namespace PersonalKnowledgeBase.Api.Models;

/// <summary>
/// Many-to-many junction between <see cref="Note"/> and <see cref="Tag"/>.
/// Composite primary key (<see cref="NoteId"/>, <see cref="TagId"/>).
/// </summary>
public class NoteTag
{
    /// <summary>Foreign key to <see cref="Note"/>.</summary>
    public Guid NoteId { get; set; }

    /// <summary>Foreign key to <see cref="Tag"/>.</summary>
    public Guid TagId { get; set; }

    /// <summary>Navigation to the note.</summary>
    public Note Note { get; set; } = null!;

    /// <summary>Navigation to the tag.</summary>
    public Tag Tag { get; set; } = null!;
}
