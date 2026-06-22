/**
 * Shared wire types referenced by multiple `api/*` modules. Kept in a
 * dedicated file so the `tags` inline shape stays in one place (the
 * `NoteResponse.tags` array uses the same `{ id, name }` shape).
 */
export interface TagRef {
  id: string;
  name: string;
}
