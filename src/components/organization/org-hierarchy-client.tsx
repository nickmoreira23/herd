"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { OrgTree, type OrgNode } from "./org-tree";
import { OrgContextBanner } from "./org-context-banner";
import { OrgVerticalDepartments } from "./org-vertical-departments";

/**
 * Sub-26.4a — orquestrador client da página de hierarquia.
 *
 * Estado de "contexto vertical ativo" via URL param `?ctx=<childId>` (in-host,
 * persiste na navegação, sobrevive refresh, explícito na URL). Valida que o
 * ctx ∈ descendentes (defesa-em-profundidade na UI; o portão de ancestralidade
 * da 26.3 é o guard real do backend). Enquanto em contexto: banner loud +
 * painel de escrita vertical.
 */
export function OrgHierarchyClient({
  root,
  descendants,
}: {
  root: { id: string; name: string };
  descendants: OrgNode[];
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Guard: useSearchParams() can be null in some render states — never call
  // .get() unguarded in the render body (that throw crashes hydration). The
  // <Suspense> boundary in page.tsx is the primary fix; this is belt-and-braces.
  const ctx = params?.get("ctx") ?? null;
  // Só trata como contexto ativo se o childId for um descendente conhecido.
  const ctxNode = ctx ? descendants.find((d) => d.id === ctx) ?? null : null;

  const enter = (childId: string) => router.push(`${pathname}?ctx=${childId}`);
  const exit = () => router.push(pathname);

  return (
    <div className="space-y-6">
      {ctxNode && (
        <OrgContextBanner childName={ctxNode.name} parentName={root.name} onExit={exit} />
      )}

      <div>
        <h1 className="text-2xl font-bold">{t("organization.hierarchy.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("organization.hierarchy.description")}
        </p>
      </div>

      <OrgTree
        root={root}
        descendants={descendants}
        activeCtxId={ctxNode?.id ?? null}
        onOperate={enter}
      />

      {ctxNode && (
        <OrgVerticalDepartments childId={ctxNode.id} childName={ctxNode.name} />
      )}
    </div>
  );
}
