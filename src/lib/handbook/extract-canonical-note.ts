/**
 * Extract the leading "canonical / for AI agents" blockquote from a Handbook
 * markdown body. Convention: every entry's body opens with a single blockquote
 * (one or more consecutive `>` lines) telling AI agents that the markdown
 * file is the canonical form. The UI hoists this note to the page footer
 * instead of the top, so it doesn't compete visually with the entry header.
 *
 * Returns the blockquote markdown verbatim (including the `>` prefixes) so
 * a Markdown renderer can format it. Returns null when the body doesn't
 * start with a blockquote.
 */
export function extractCanonicalNote(body: string): string | null {
  const lines = body.split("\n");
  const captured: string[] = [];
  let started = false;

  for (const line of lines) {
    if (!started && line.trim() === "") continue; // skip leading blanks
    if (line.startsWith(">")) {
      captured.push(line);
      started = true;
      continue;
    }
    if (started) break; // blockquote ended
    break; // first non-empty content wasn't a blockquote
  }

  return captured.length > 0 ? captured.join("\n") : null;
}
