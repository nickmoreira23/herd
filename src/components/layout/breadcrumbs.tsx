"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";

/**
 * Map a path segment to a translation key.
 *
 * Top-level features reuse `nav.sidebar.*` to avoid duplicate translations.
 * Non-top-level segments (sub-pages like `accounts`, `settings`, `new`) use
 * `nav.breadcrumb.*` when their copy is generic enough to be shared.
 *
 * Segments not in this map render literally — typically they are dynamic
 * IDs (UUIDs, slugs) or feature-specific routes that haven't been
 * internationalized yet.
 */
const SEGMENT_KEYS = {
  // Top-level (reuse nav.sidebar.*)
  admin: "nav.sidebar.dashboard",
  agents: "nav.sidebar.agents",
  organization: "nav.sidebar.organization",
  knowledge: "nav.sidebar.knowledge",
  network: "nav.sidebar.network",
  marketplace: "nav.sidebar.marketplace",
  ledger: "nav.sidebar.ledger",
  tools: "nav.sidebar.tools",
  blocks: "nav.sidebar.blocks",
  integrations: "nav.sidebar.integrations",
  chat: "nav.sidebar.chat",

  // Non-top-level segments
  new: "nav.breadcrumb.new",
  settings: "nav.breadcrumb.settings",
} as const satisfies Record<string, MessageKey>;

function getLabelKey(segment: string): MessageKey | null {
  return (SEGMENT_KEYS as Record<string, MessageKey>)[segment] ?? null;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useT();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 2) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const key = getLabelKey(segment);
        const label = key ? t(key) : segment;
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
