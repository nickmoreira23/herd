/**
 * Split a markdown body into sections by H2 (## ...).
 *
 * Returns { intro, sections }:
 * - intro: text before the first H2 (or whole body if no H2 found)
 * - sections: { id, title, content, h3Count }[]
 *
 * Line-based parser. Tracks fenced code blocks (```) so an H2-looking
 * line inside a code block isn't treated as a section break.
 */

export interface MarkdownSection {
  /** Slug derived from title; stable id for persistence. */
  id: string;
  /** Raw section title (e.g. "Business"). */
  title: string;
  /** Section content excluding the H2 header line. */
  content: string;
  /** Count of H3 (`### ...`) inside content. */
  h3Count: number;
}

export interface SplitResult {
  intro: string;
  sections: MarkdownSection[];
}

export function splitByH2(body: string): SplitResult {
  const lines = body.split("\n");
  const sections: MarkdownSection[] = [];
  const introLines: string[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inFence = false;

  for (const line of lines) {
    if (line.startsWith("```")) inFence = !inFence;
    const isH2 = !inFence && /^## (?!#)/.test(line);

    if (isH2) {
      if (current) sections.push(buildSection(current));
      current = { title: line.replace(/^## /, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) sections.push(buildSection(current));

  return {
    intro: introLines.join("\n").trim(),
    sections,
  };
}

function buildSection(c: { title: string; lines: string[] }): MarkdownSection {
  const content = c.lines.join("\n").trim();
  return {
    id: slugify(c.title),
    title: c.title,
    content,
    h3Count: countH3(content),
  };
}

function countH3(content: string): number {
  let count = 0;
  let inFence = false;
  for (const line of content.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^### (?!#)/.test(line)) count++;
  }
  return count;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
