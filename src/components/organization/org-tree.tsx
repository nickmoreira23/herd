"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Building2, ArrowRightCircle } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

export interface OrgNode {
  id: string;
  slug: string;
  name: string;
  parentOrgId: string | null;
  depth: number;
}

/**
 * Sub-26.4a — tree-view da árvore de organizações (espelha department-tree).
 * Raiz = org ativa (host); descendentes aninhados por parentOrgId. Cada
 * descendente tem "Operar esta sub-org" → entra no contexto vertical (onOperate
 * seta ?ctx). Org-folha (sem descendentes) → estado vazio claro. Tokens de tema,
 * i18n; nenhuma capability de isolamento — só navegação + entrada de contexto.
 */
export function OrgTree({
  root,
  descendants,
  activeCtxId,
  onOperate,
}: {
  root: { id: string; name: string };
  descendants: OrgNode[];
  activeCtxId: string | null;
  onOperate: (childId: string) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([root.id, ...descendants.map((d) => d.id)]),
  );

  const childrenOf = (parentId: string) =>
    descendants.filter((d) => d.parentOrgId === parentId);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function renderNode(id: string, name: string, depth: number, isRoot: boolean) {
    const kids = childrenOf(id);
    const isExpanded = expanded.has(id);
    const isActive = id === activeCtxId;
    return (
      <div key={id}>
        <div
          className={`flex items-center gap-2 py-2.5 px-3 rounded-lg transition-colors group ${
            isActive ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <button
            onClick={() => toggle(id)}
            className="w-5 h-5 flex items-center justify-center shrink-0"
          >
            {kids.length > 0 ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium flex-1 min-w-0 truncate">{name}</span>

          {!isRoot && (
            <button
              onClick={() => onOperate(id)}
              className="flex items-center gap-1 text-xs font-medium text-primary px-2 py-1 rounded-md hover:bg-primary/10 transition-colors shrink-0"
            >
              <ArrowRightCircle className="h-3.5 w-3.5" />
              {t("organization.hierarchy.operate_button")}
            </button>
          )}
        </div>

        {isExpanded && kids.map((k) => renderNode(k.id, k.name, depth + 1, false))}
      </div>
    );
  }

  return (
    <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden">
      <div className="divide-y divide-border">
        {renderNode(root.id, root.name, 0, true)}
      </div>
      {descendants.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground border-t border-border">
          {t("organization.hierarchy.empty")}
        </div>
      )}
    </div>
  );
}
