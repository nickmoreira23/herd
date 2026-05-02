import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";
import { HANDBOOK_CONFIG, type HandbookLocale } from "./config";

export interface EntryFrontmatter {
  title: string;
  description: string;
  locale: HandbookLocale;
  uid: string;
}

export interface ReadEntryResult {
  frontmatter: EntryFrontmatter;
  body: string;
  relativePath: string;
  absolutePath: string;
}

export interface BilingualReadResult {
  ptBR: ReadEntryResult;
  enUS: ReadEntryResult;
}

export function readEntryBilingual(entryPath: string): BilingualReadResult | null {
  const ptBR = readEntry(entryPath, "pt-BR");
  const enUS = readEntry(entryPath, "en-US");
  if (!ptBR || !enUS) return null;
  return { ptBR, enUS };
}

export function readEntry(
  entryPath: string,
  locale: HandbookLocale,
): ReadEntryResult | null {
  const filename = `${locale}.md`;
  const fullPath = join(
    process.cwd(),
    HANDBOOK_CONFIG.handbookRoot,
    entryPath,
    filename,
  );

  let raw: string;
  try {
    raw = readFileSync(fullPath, "utf-8");
  } catch {
    return null;
  }

  const parsed = matter(raw);
  const frontmatter = parsed.data as EntryFrontmatter;
  return {
    frontmatter,
    body: parsed.content,
    relativePath: relative(process.cwd(), fullPath),
    absolutePath: fullPath,
  };
}
