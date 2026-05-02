import { findByUid, type IndexEntry } from "./search-index";
import { isAllowlisted } from "./allowlist";
import { hrefForEntry } from "./href-for-entry";

export interface ResolvedRef {
  uid: string;
  status: "resolved" | "allowlisted" | "broken";
  /** Filled when status === "resolved". Plain serializable shape. */
  resolvedTitlePtBR?: string;
  resolvedTitleEnUS?: string;
  href?: string;
}

export function resolveCrossRefs(
  fromUid: string,
  refs: string[],
  field: "consumes" | "consumed_by" | "related",
): ResolvedRef[] {
  return refs.map((uid) => {
    const resolved = findByUid(uid);
    if (resolved) {
      return {
        uid,
        status: "resolved" as const,
        resolvedTitlePtBR: resolved.title_pt_BR,
        resolvedTitleEnUS: resolved.title_en_US,
        href: hrefForEntry(resolved),
      };
    }
    if (isAllowlisted(fromUid, field, uid)) {
      return { uid, status: "allowlisted" as const };
    }
    return { uid, status: "broken" as const };
  });
}

export interface BilingualCrossRefs {
  consumes: ResolvedRef[];
  consumedBy: ResolvedRef[];
}

export function resolveBilingualCrossRefs(entry: IndexEntry): BilingualCrossRefs {
  return {
    consumes: resolveCrossRefs(entry.uid, entry.consumes, "consumes"),
    consumedBy: resolveCrossRefs(entry.uid, entry.consumed_by, "consumed_by"),
  };
}
