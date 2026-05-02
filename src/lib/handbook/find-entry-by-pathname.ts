import type { IndexEntry } from "./search-index";

/**
 * Find the Handbook entry that corresponds to the current admin pathname,
 * matching against the entry's `admin_paths` field.
 *
 * Returns the entry whose `admin_paths` contain the longest prefix of
 * `pathname`. Longer match wins (more specific). Null when nothing
 * matches.
 *
 * Note: matches against `admin_paths` (URL-style, e.g. `/admin/blocks/contacts`),
 * not `source_paths` (filesystem-style, e.g. `src/lib/foo`). Filesystem
 * paths are still useful for the doc-first nudge in Danger.js, but they
 * don't share a tree with browser pathnames.
 */
export function findEntryByPathname(
  index: IndexEntry[],
  pathname: string,
): IndexEntry | null {
  let best: { entry: IndexEntry; pathLength: number } | null = null;

  for (const entry of index) {
    if (!entry.admin_paths || entry.admin_paths.length === 0) continue;

    for (const adminPath of entry.admin_paths) {
      const normalized = adminPath.startsWith("/")
        ? adminPath
        : `/${adminPath}`;

      if (pathname === normalized || pathname.startsWith(normalized + "/")) {
        const len = normalized.length;
        if (!best || len > best.pathLength) {
          best = { entry, pathLength: len };
        }
      }
    }
  }

  return best?.entry ?? null;
}
