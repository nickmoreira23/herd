import type { IndexEntry } from "./search-index";

/**
 * URL relative path for navigating to a Handbook entry, derived from
 * its level and parent UID. Shared between cross-refs, search, and
 * any other component that needs to link to an entry.
 */
export function hrefForEntry(entry: IndexEntry): string {
  if (entry.level === "meta") return `/admin/handbook/meta/${entry.id}`;
  if (entry.level === "layer") return `/admin/handbook/${entry.id}`;
  if (entry.level === "category") {
    const layerId = entry.parent?.split(".").pop();
    return `/admin/handbook/${layerId}/${entry.id}`;
  }
  // feature: parent is herd.category.{layer}.{category}
  const parts = entry.parent?.split(".") ?? [];
  const layerId = parts[2];
  const categoryId = parts[3];
  return `/admin/handbook/${layerId}/${categoryId}/${entry.id}`;
}
