/**
 * Strip HTML tags and decode the most common named / numeric entities
 * to plain text. Used to derive `contentText` for the `createNote` /
 * `updateNote` request body when the editor's plain-text getter isn't
 * available (the editor is read-only on the detail page).
 *
 * The server is the source of truth for `contentText` — it re-derives
 * the value from `contentJson` via `NoteService.DerivePlainText` and
 * overwrites any client-supplied value if it is empty. This helper
 * only exists so the request payload is non-empty in the common case
 * (it improves the pre-search and snippet quality).
 *
 * Intentionally minimal — no parser, no DOM. Sufficient for TipTap's
 * output (Paragraph / Heading / List / Link / Code).
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '(c)',
  reg: '(r)',
  trade: '(tm)',
  hellip: '...',
  mdash: '--',
  ndash: '-',
  laquo: '<<',
  raquo: '>>',
};

function decodeEntity(match: string): string {
  const body = match.slice(1, -1);
  if (body[0] === '#') {
    const code = body[1] === 'x' || body[1] === 'X'
      ? parseInt(body.slice(2), 16)
      : parseInt(body.slice(1), 10);
    if (Number.isFinite(code) && code > 0) {
      try {
        return String.fromCodePoint(code);
      } catch {
        return '';
      }
    }
    return '';
  }
  return NAMED_ENTITIES[body] ?? match;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  // Drop <script> / <style> blocks entirely (their text content is not
  // user-facing and may include things like `</script>` that confuse
  // the tag-strip regex below).
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  // Replace block-level closers with newlines so paragraphs survive.
  const withBreaks = cleaned
    .replace(/<\/(p|div|h[1-6]|li|blockquote|br|hr)\s*>/gi, '\n')
    .replace(/<br\s*\/?>(?!\n)/gi, '\n');
  // Drop all remaining tags.
  const text = withBreaks.replace(/<[^>]+>/g, '');
  // Decode entities.
  const decoded = text.replace(/&(?:#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, decodeEntity);
  // Collapse runs of whitespace; trim.
  return decoded
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}
