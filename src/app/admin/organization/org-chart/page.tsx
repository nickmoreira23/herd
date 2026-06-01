import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";
import { ComingSoon } from "@/components/coming-soon";

/**
 * Org Chart — placeholder "em breve".
 *
 * O `OrgChartCanvas` + os endpoints `/api/org-chart/*` crasham (tech-debt
 * [ALTA], Fase 3: refs stale a `NetworkProfile.profileRoles`/`parentId`
 * dropados na Sub-3.6). Até a Fase 3 ser reconciliada, a rota renderiza um
 * placeholder honesto em vez da tela quebrada. O componente e os endpoints
 * permanecem no repo, apenas não são mais renderizados/chamados por esta rota.
 */
export default async function OrgChartPage() {
  const locale = await getLocale();
  return (
    <ComingSoon
      title={t("organization.subpanel.org_chart", locale)}
      message={t("organization.coming_soon", locale)}
    />
  );
}
