/**
 * Parse a Glossary section's markdown into `{ term, definition }` rows.
 * Convention: each entry is a single line, `- **Term**: Definition`.
 * Multi-line definitions and nested lists are not supported by design —
 * keep entries to one line each.
 */
export interface GlossaryEntry {
  term: string;
  definition: string;
}

const GLOSSARY_LINE = /^-\s+\*\*(.+?)\*\*\s*:\s*(.+)$/gm;

export function parseGlossary(content: string): GlossaryEntry[] {
  const out: GlossaryEntry[] = [];
  for (const m of content.matchAll(GLOSSARY_LINE)) {
    out.push({ term: m[1].trim(), definition: m[2].trim() });
  }
  return out;
}

/**
 * Parse a Changelog section's markdown into `{ date, description }` rows.
 * Convention: each entry is `- **DATE** — Description`. The separator
 * between date and description may be em-dash (—), en-dash (–), or hyphen
 * (-). Multi-line descriptions are joined onto the same line.
 */
export interface ChangelogEntry {
  date: string;
  description: string;
}

const CHANGELOG_LINE = /^-\s+\*\*(.+?)\*\*\s*[—–-]?\s*(.+)$/gm;

export function parseChangelog(content: string): ChangelogEntry[] {
  const out: ChangelogEntry[] = [];
  for (const m of content.matchAll(CHANGELOG_LINE)) {
    out.push({ date: m[1].trim(), description: m[2].trim() });
  }
  return out;
}
