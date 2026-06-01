import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";
import { ComingSoon } from "@/components/coming-soon";

/**
 * Network Map — placeholder "em breve".
 *
 * O `NetworkMapCanvas` + o endpoint `/api/org-chart/external` crasham (tech-debt
 * [ALTA], Fase 3: refs stale a `NetworkProfile.parentId` dropado na Sub-3.6).
 * Até a Fase 3 ser reconciliada, a rota renderiza um placeholder honesto. O
 * componente e o endpoint permanecem no repo, apenas não são mais
 * renderizados/chamados por esta rota.
 */
export default async function NetworkMapPage() {
  const locale = await getLocale();
  return (
    <ComingSoon
      title={t("organization.subpanel.network_map", locale)}
      message={t("organization.coming_soon", locale)}
    />
  );
}
