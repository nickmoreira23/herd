"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFinancialStore } from "@/stores/financial-store";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { FinancialInputs } from "@/lib/financial-engine";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExecutiveSummary } from "./executive-summary";
import { MetricsPanel } from "./metrics-panel";
import { FinancialCharts } from "./financial-charts";
import { PLStatement } from "./pl-statement";
import { ProjectionSpreadsheet } from "./projection-spreadsheet";
import { CohortSpreadsheet } from "./cohort-spreadsheet";
import { getTimePeriodMultiplier, getTimePeriodLabel } from "./financial-page-client";
import { MEMBER_PREFIX, REPS_ROLE_KEY } from "./spreadsheet-shared";

/** The projection tabs a share link may include, in display order. */
export const SHARE_TABS: { key: string; labelKey: MessageKey }[] = [
  { key: "summary", labelKey: "financials.toolbar.tab.summary" },
  { key: "statement", labelKey: "financials.toolbar.tab.statement" },
  { key: "spreadsheet", labelKey: "financials.toolbar.tab.spreadsheet" },
  { key: "cohort", labelKey: "financials.toolbar.tab.cohort" },
  { key: "metrics", labelKey: "financials.toolbar.tab.metrics" },
  { key: "charts", labelKey: "financials.toolbar.tab.charts" },
];

/**
 * PUBLIC, no-auth full-screen view of ONE perspective of a projection, opened
 * via a share link. Loads the snapshot's inputs into the store and renders the
 * same projection tabs as the admin page — locked to the shared perspective
 * and section set, with NO assumptions panel and no perspective switcher.
 */
export function SharedProjectionView({ token, locale }: { token: string; locale: Locale }) {
  const t = useT();
  const { loadInputs, results, inputs } = useFinancialStore();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [scenarioName, setScenarioName] = useState("");
  const [perspective, setPerspective] = useState("general");
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projections/shared/${token}`, {
          headers: { accept: "application/json" },
        });
        if (cancelled) return;
        if (!res.ok) {
          setErrorMsg(
            res.status === 404
              ? t("financials.share.error_not_found")
              : res.status === 410
                ? t("financials.share.error_expired")
                : t("financials.share.error_generic"),
          );
          setStatus("error");
          return;
        }
        const { data } = await res.json();
        if (cancelled) return;
        loadInputs(data.assumptions as FinancialInputs, data.scenarioName ?? "");
        setScenarioName(data.scenarioName ?? "");
        setPerspective(data.perspective ?? "general");
        setSections(Array.isArray(data.sections) ? data.sections : []);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setErrorMsg(t("financials.share.error_generic"));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, loadInputs, t]);

  if (status === "loading" || (status === "ready" && !results)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">{t("financials.share.loading")}</span>
      </div>
    );
  }

  if (status === "error" || !results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-semibold">{t("financials.share.error_title")}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{errorMsg}</p>
      </div>
    );
  }

  const periodMultiplier = getTimePeriodMultiplier("month", 6);
  const periodLabel = getTimePeriodLabel("month", 6, t);

  // Resolve a human label for the locked perspective for the header.
  let perspectiveLabel = t("financials.share.full_projection");
  if (perspective.startsWith(MEMBER_PREFIX)) {
    const key = perspective.slice(MEMBER_PREFIX.length);
    perspectiveLabel =
      key === REPS_ROLE_KEY
        ? t("financials.member_earnings.rep")
        : results.salesTeam.levels.find((l) => l.id === key)?.name || perspectiveLabel;
  } else if (perspective.startsWith("party:")) {
    const id = perspective.slice("party:".length);
    perspectiveLabel = inputs.profitSplitParties?.find((p) => p.id === id)?.name || perspectiveLabel;
  }

  const visibleTabs = sections.length ? SHARE_TABS.filter((tb) => sections.includes(tb.key)) : SHARE_TABS;
  const has = (key: string) => visibleTabs.some((tb) => tb.key === key);
  const defaultTab = visibleTabs[0]?.key ?? "spreadsheet";

  // Full-height shell: header + tabs stay put, only the content scrolls — so
  // switching tabs never shifts the page structure.
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header — full-bleed: logo left, projection + perspective right. */}
      <header className="shrink-0 border-b">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <span className="text-lg font-bold tracking-tight">{t("common.brand_name")}</span>
          <div className="min-w-0 text-right">
            <h1 className="truncate text-sm font-semibold">
              {scenarioName || t("financials.share.untitled")}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {t("financials.share.viewing_as", { role: perspectiveLabel })}
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue={defaultTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-6 pt-5">
          <TabsList className="h-8 w-full justify-start overflow-x-auto">
            {visibleTabs.map((tb) => (
              <TabsTrigger key={tb.key} value={tb.key} className="h-6 shrink-0 px-3 text-xs">
                {t(tb.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          {has("summary") && (
            <TabsContent value="summary" className="mt-0">
              <ExecutiveSummary locale={locale} hideAssumptions />
            </TabsContent>
          )}
          {has("statement") && (
            <TabsContent value="statement" className="mt-0">
              <PLStatement multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
            </TabsContent>
          )}
          {has("spreadsheet") && (
            <TabsContent value="spreadsheet" className="mt-0">
              <ProjectionSpreadsheet months={12} locale={locale} perspective={perspective} />
            </TabsContent>
          )}
          {has("cohort") && (
            <TabsContent value="cohort" className="mt-0">
              <CohortSpreadsheet months={36} locale={locale} perspective={perspective} />
            </TabsContent>
          )}
          {has("metrics") && (
            <TabsContent value="metrics" className="mt-0">
              <MetricsPanel multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
            </TabsContent>
          )}
          {has("charts") && (
            <TabsContent value="charts" className="mt-0">
              <FinancialCharts multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
