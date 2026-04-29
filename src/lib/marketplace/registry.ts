import { getAllBlocks } from "@/lib/blocks/registry";
import type { EligibleBlock } from "./types";

/**
 * Every block registered in the platform is eligible to be the source
 * of a Marketplace section. The Block-step UI groups them by the same
 * category configuration used in the /admin/blocks sub-panel.
 */
export function getEligibleBlocks(): EligibleBlock[] {
  return getAllBlocks()
    .filter((b) => b.types.length > 0)
    .map((b) => ({
      name: b.name,
      displayName: b.displayName,
      domain: b.domain,
      primaryType: b.types[0],
    }));
}

export function isEligibleBlock(name: string): boolean {
  return getAllBlocks().some((b) => b.name === name && b.types.length > 0);
}
