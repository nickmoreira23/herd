import { getIndex } from "@/lib/handbook/search-index";
import {
  ViewHandbookButtonAuto,
  type AdminPathEntry,
} from "./view-handbook-button-auto";

/**
 * Server wrapper: loads the search-index server-side, projects to the
 * minimal AdminPathEntry shape, and passes it to the Client Component.
 * Drop into any admin page that has a header — auto-resolves to the
 * correct Handbook entry based on the page's pathname (matched against
 * `admin_paths` declared in feature.yml).
 *
 * If no entry has `admin_paths` covering the current pathname, the
 * underlying ViewHandbookButton renders null — invisible.
 */
export function ViewHandbookButtonAutoServer() {
  const index = getIndex();
  const projection: AdminPathEntry[] = index.map((e) => ({
    uid: e.uid,
    id: e.id,
    level: e.level,
    parent: e.parent,
    admin_paths: e.admin_paths ?? [],
  }));
  return <ViewHandbookButtonAuto index={projection} />;
}
