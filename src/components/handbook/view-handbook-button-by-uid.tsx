import { findByUid } from "@/lib/handbook/search-index";
import { hrefForEntry } from "@/lib/handbook/href-for-entry";
import { ViewHandbookButton } from "./view-handbook-button";

interface Props {
  /** UID of the Handbook entry. If absent from the index, button is not rendered. */
  entryUid: string;
}

export function ViewHandbookButtonByUid({ entryUid }: Props) {
  const entry = findByUid(entryUid);
  const href = entry ? hrefForEntry(entry) : null;
  return <ViewHandbookButton href={href} />;
}
