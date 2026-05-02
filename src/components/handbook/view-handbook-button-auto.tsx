"use client";

import { usePathname } from "next/navigation";
import { ViewHandbookButton } from "./view-handbook-button";

/**
 * Minimal entry projection passed from the Server wrapper. Only the
 * fields needed to resolve a pathname → URL. Avoids dragging the full
 * IndexEntry type (which is associated with the server-side
 * search-index runtime) into the client bundle.
 */
export interface AdminPathEntry {
  uid: string;
  id: string;
  level: string;
  parent: string | null;
  admin_paths: string[];
}

interface Props {
  /** Index projection passed by Server wrapper. */
  index: AdminPathEntry[];
}

export function ViewHandbookButtonAuto({ index }: Props) {
  const pathname = usePathname();
  const entry = findEntryByPathname(index, pathname ?? "");
  const href = entry ? hrefForEntry(entry) : null;
  return <ViewHandbookButton href={href} />;
}

function findEntryByPathname(
  index: AdminPathEntry[],
  pathname: string,
): AdminPathEntry | null {
  let best: { entry: AdminPathEntry; pathLength: number } | null = null;

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

/**
 * Inline copy of href-for-entry.ts. Duplicated to avoid pulling
 * search-index module (which has node:fs) into the client bundle —
 * type-only import would fail build because the value `hrefForEntry`
 * is a runtime function.
 */
function hrefForEntry(entry: AdminPathEntry): string {
  if (entry.level === "meta") return `/admin/handbook/meta/${entry.id}`;
  if (entry.level === "layer") return `/admin/handbook/${entry.id}`;
  if (entry.level === "category") {
    const layerId = entry.parent?.split(".").pop();
    return `/admin/handbook/${layerId}/${entry.id}`;
  }
  const parts = entry.parent?.split(".") ?? [];
  const layerId = parts[2];
  const categoryId = parts[3];
  return `/admin/handbook/${layerId}/${categoryId}/${entry.id}`;
}
