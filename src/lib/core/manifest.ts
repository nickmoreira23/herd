/**
 * Area manifest — macro-divisão do produto onde tools são posicionadas.
 *
 * Areas são camada estrutural acima de Tools na hierarquia 5-níveis:
 * Networks → Areas → Tools → Blocks → Integrations.
 *
 * 6 areas iniciais (R2): Communication, Transaction, Workflow,
 * Notification, Identity, Infrastructure.
 *
 * Areas não têm tools embedded. Lookup tools-by-area via registry
 * (filter sobre toolRegistry).
 *
 * Ver docs/handbook/refactor/r2-areas-foundation/(overview)/ para contexto.
 */

import type { EntityManifest } from "@/lib/blocks/manifest";

export type AreaKind = "area";

export interface AreaManifest {
  kind: "area";
  /** Machine name, e.g. "communication", "transaction" */
  name: string;
  /** Display name, e.g. "Communication", "Transaction" */
  displayName: string;
  /** Business-level description */
  description: string;
  /** Lucide icon name (string for serialization) */
  icon: string;
  /** Hex color for visual theming */
  color: string;
  /** Sort order in sidebar navigation */
  sortOrder: number;
}

export function isAreaManifest(m: EntityManifest): m is AreaManifest {
  return m.kind === "area";
}
