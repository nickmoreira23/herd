"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFinancialStore } from "@/stores/financial-store";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { FinancialInputs } from "@/lib/financial-engine";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExecutiveSummary } from "./executive-summary";
import { MetricsPanel } from "./metrics-panel";
import { FinancialCharts } from "./financial-charts";
import { PLStatement } from "./pl-statement";
import { ProjectionSpreadsheet } from "./projection-spreadsheet";
import { CohortSpreadsheet } from "./cohort-spreadsheet";
import { getTimePeriodMultiplier, getTimePeriodLabel } from "./financial-page-client";
import { MEMBER_PREFIX, REPS_ROLE_KEY } from "./spreadsheet-shared";

/**
 * PUBLIC, no-auth full-screen view of ONE perspective of a projection, opened
 * via a share link. Loads the snapshot's inputs into the store and renders the
 * same projection tabs as the admin page — locked to the shared perspective,
 * with NO assumptions panel and no perspective switcher.
 */
export function SharedProjectionView({ token, locale }: { token: string; locale: Locale }) {
  const t = useT();
  const { loadInputs, results, inputs } = useFinancialStore();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [scenarioName, setScenarioName] = useState("");
  const [perspective, setPerspective] = useState("general");

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

  // Resolve a human label for the locked perspective for the header chip.
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

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-4 sm:px-6">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">
            {scenarioName || t("financials.share.untitled")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("financials.share.viewing_as", { role: perspectiveLabel })}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common.brand_name")}
        </span>
      </header>

      <Tabs defaultValue="spreadsheet" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="h-8 w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.summary")}</TabsTrigger>
          <TabsTrigger value="statement" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.statement")}</TabsTrigger>
          <TabsTrigger value="spreadsheet" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.spreadsheet")}</TabsTrigger>
          <TabsTrigger value="cohort" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.cohort")}</TabsTrigger>
          <TabsTrigger value="metrics" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.metrics")}</TabsTrigger>
          <TabsTrigger value="charts" className="h-6 px-3 text-xs">{t("financials.toolbar.tab.charts")}</TabsTrigger>
        </TabsList>
        <div className="mt-3 flex-1 overflow-y-auto">
          <TabsContent value="summary" className="mt-0">
            <ExecutiveSummary locale={locale} />
          </TabsContent>
          <TabsContent value="statement" className="mt-0">
            <PLStatement multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
          </TabsContent>
          <TabsContent value="spreadsheet" className="mt-0">
            <ProjectionSpreadsheet months={12} locale={locale} perspective={perspective} />
          </TabsContent>
          <TabsContent value="cohort" className="mt-0">
            <CohortSpreadsheet months={36} locale={locale} perspective={perspective} />
          </TabsContent>
          <TabsContent value="metrics" className="mt-0">
            <MetricsPanel multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} perspective={perspective} />
          </TabsContent>
          <TabsContent value="charts" className="mt-0">
            <FinancialCharts multiplier={periodMultiplier} periodLabel={periodLabel} locale={locale} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
