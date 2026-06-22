namespace PersonalKnowledgeBase.Api.DTOs.Search;

/// <summary>
/// A single hit from <c>GET /api/search</c>. <see cref="Snippet"/> contains FTS5
/// <c>snippet()</c> output with <c>&lt;mark&gt;</c> tags around matched terms;
/// the caller is responsible for HTML-escaping anything outside those tags before
/// rendering.
/// </summary>
/// <param name="NoteId">Identifier of the matching note.</param>
/// <param name="Title">Note title at the time of the search.</param>
/// <param name="Snippet">Short excerpt from the note body, with matches wrapped in <c>&lt;mark&gt;</c>.</param>
public record SearchHit(Guid NoteId, string Title, string Snippet);
