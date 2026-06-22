/**
 * Parse a server-issued search snippet (which wraps matches in literal
 * `<mark>…</mark>` tags) into a list of renderable runs. The output
 * is intended to be rendered with React's automatic escaping —
 * never via `dangerouslySetInnerHTML`.
 *
 * The parser is intentionally simple (no HTML entity decoding beyond
 * the tags we know about). The server is the source of truth; if the
 * server starts emitting a different tag set, this helper will fall
 * back to rendering the snippet as a single unmarked run.
 *
 * Contract:
 *   - The `mark: true` runs contain the matched term and should be
 *     rendered with a highlighted style (`bg-yellow-200 text-foreground
 *     dark:bg-yellow-900` or similar).
 *   - The `mark: false` runs are plain text; render with the normal
 *     text colour.
 *   - Malformed input (unclosed `<mark>`, stray `</mark>`) is handled
 *     gracefully: the unmatched tag is rendered as a literal string in
 *     the unmarked run; the matches inside are still highlighted.
 *
 * @example
 *   parseSnippet('Hello <mark>world</mark>!')
 *   // → [
 *   //     { text: 'Hello ', mark: false },
 *   //     { text: 'world', mark: true },
 *   //     { text: '!',     mark: false },
 *   //   ]
 */
export interface SnippetRun {
  text: string;
  mark: boolean;
}

export function parseSnippet(snippet: string): SnippetRun[] {
  if (!snippet) return [];
  // Split on the literal closing tag first, then on the literal opening
  // tag. The two-step split keeps unmatched `</mark>` inside a marked
  // run (it stays highlighted) and an unclosed `<mark>` inside an
  // unmarked run (it is rendered as literal text).
  const closeTag = '</mark>';
  const openTag = '<mark>';

  const closeSplit = snippet.split(closeTag);
  const runs: SnippetRun[] = [];
  for (let i = 0; i < closeSplit.length; i += 1) {
    const segment = closeSplit[i];
    if (segment === undefined) continue;
    if (i > 0) {
      // Each `</mark>` closed a marked run. The next segment is plain
      // text until the next `<mark>` opens again.
      const openSplit = segment.split(openTag);
      for (let j = 0; j < openSplit.length; j += 1) {
        const piece = openSplit[j];
        if (piece === undefined) continue;
        if (j === 0) {
          // Right after a `</mark>` and before the next `<mark>`.
          if (piece.length > 0) runs.push({ text: piece, mark: false });
        } else {
          // After a `<mark>`, the content is marked until the next
          // `</mark>` (handled by the outer loop's next iteration).
          if (piece.length > 0) runs.push({ text: piece, mark: true });
        }
      }
    } else {
      // The very first segment is before any `</mark>`. It may contain
      // an opening `<mark>` that starts a marked run.
      const openSplit = segment.split(openTag);
      for (let j = 0; j < openSplit.length; j += 1) {
        const piece = openSplit[j];
        if (piece === undefined) continue;
        if (j === 0) {
          if (piece.length > 0) runs.push({ text: piece, mark: false });
        } else {
          if (piece.length > 0) runs.push({ text: piece, mark: true });
        }
      }
    }
  }
  return runs;
}
