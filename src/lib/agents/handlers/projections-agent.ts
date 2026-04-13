import Anthropic from "@anthropic-ai/sdk";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateScenario, type FinancialInputs } from "@/lib/financial-engine";
import type { SendFn } from "../runtime";

// ─── Tool Definitions ──────────────────────────────────────────

export const PROJECTIONS_AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_scenarios",
    description:
      "List all saved financial projection scenarios with their key metrics (MRR, margin, breakeven). Use this to understand what models exist.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_scenario",
    description:
      "Get the full details of a saved financial scenario — both the assumptions (inputs) and the calculated results.",
    input_schema: {
      type: "object" as const,
      properties: {
        scenarioId: {
          type: "string",
          description: "The UUID of the scenario to retrieve",
        },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "calculate_projection",
    description:
      "Run the financial engine on a set of assumptions and return the full results. Use this to test 'what if' scenarios without saving. Pass modified inputs to see how changes affect MRR, margins, LTV/CAC, breakeven, and the 24-month cohort projection.",
    input_schema: {
      type: "object" as const,
      properties: {
        inputs: {
          type: "object",
          description:
            "Complete FinancialInputs object. Must include: tiers, billingCycleDistribution, creditRedemptionRate, avgCOGSToMemberPriceRatio, fulfillmentCostPerOrder, shippingCostPerOrder, commissionStructure, salesRepChannel, samplerChannel, partnerKickbacks, operationalOverhead.",
        },
      },
      required: ["inputs"],
    },
  },
  {
    name: "modify_assumptions",
    description:
      "Modify specific assumptions in a scenario's inputs. Provide the scenario ID and a partial update object. Returns the recalculated results with the new assumptions. Does NOT save — use save_scenario to persist.",
    input_schema: {
      type: "object" as const,
      properties: {
        scenarioId: {
          type: "string",
          description: "The UUID of the scenario whose inputs to modify",
        },
        changes: {
          type: "object",
          description:
            "Partial FinancialInputs — only the fields to change. Supports nested paths like { salesRepChannel: { startingReps: 20 } } or { tiers: [...] }. Unchanged fields keep their current values.",
        },
      },
      required: ["scenarioId", "changes"],
    },
  },
  {
    name: "save_scenario",
    description:
      "Save a new financial projection scenario or update an existing one. Persists both assumptions and results to the database.",
    input_schema: {
      type: "object" as const,
      properties: {
        scenarioId: {
          type: "string",
          description:
            "If updating an existing scenario, provide its UUID. Omit to create new.",
        },
        name: {
          type: "string",
          description: "Name for the scenario (e.g., 'Conservative Q3', 'Aggressive Growth')",
        },
        inputs: {
          type: "object",
          description: "Complete FinancialInputs object",
        },
        notes: {
          type: "string",
          description: "Optional notes about this scenario",
        },
      },
      required: ["name", "inputs"],
    },
  },
  {
    name: "delete_scenario",
    description: "Delete a saved financial projection scenario by ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        scenarioId: {
          type: "string",
          description: "The UUID of the scenario to delete",
        },
      },
      required: ["scenarioId"],
    },
  },
  {
    name: "compare_scenarios",
    description:
      "Compare two or more scenarios side-by-side. Returns key metrics (MRR, margin, LTV/CAC, breakeven, 12-month profit) for each scenario in a comparison table format.",
    input_schema: {
      type: "object" as const,
      properties: {
        scenarioIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of scenario UUIDs to compare (2-5 scenarios)",
        },
      },
      required: ["scenarioIds"],
    },
  },
  {
    name: "get_current_defaults",
    description:
      "Get the current live data from the system that feeds into projections — tier pricing, product COGS, commission plan rates, partner kickbacks, and operational expenses. Use this to build projections based on real data.",
    input_schema: { type: "object" as const, properties: {} },
  },
];

// ─── Context Builder ──────────────────────────────────────────

export async function buildProjectionsAgentContext(clientContext?: Record<string, unknown>): Promise<{
  extraPrompt: string;
  scenarioCount: number;
}> {
  const scenarios = await prisma.financialSnapshot.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, scenarioName: true, updatedAt: true },
  });

  const scenarioList = scenarios.length > 0
    ? scenarios
        .map(
          (s) =>
            `  - "${s.scenarioName}" [${s.id}] (updated ${s.updatedAt.toISOString().split("T")[0]})`
        )
        .join("\n")
    : "  (no saved scenarios yet)";

  // Build live editor context if the user is currently editing a model
  let liveEditorSection = "";
  if (clientContext?.liveEditorState) {
    const editorState = clientContext.liveEditorState as {
      inputs?: Record<string, unknown>;
      results?: Record<string, unknown>;
    };
    if (editorState.inputs) {
      liveEditorSection = `
=== LIVE EDITOR STATE (CURRENT MODEL BEING EDITED) ===
IMPORTANT: The user is currently editing a financial model in the UI. When they ask about metrics,
assumptions, or "what does X mean", ALWAYS use the live data below — NOT saved scenarios or defaults.
This is the real-time state of what they see on screen.

--- CURRENT ASSUMPTIONS ---
${JSON.stringify(editorState.inputs, null, 2)}
${editorState.results ? `
--- CURRENT CALCULATED RESULTS ---
${JSON.stringify(editorState.results, null, 2)}` : ""}

`;
    }
  }

  const extraPrompt = `
${liveEditorSection}=== CURRENT SAVED SCENARIOS ===
${scenarioList}

=== FINANCIAL MODEL STRUCTURE ===
The projections tool models a subscription box business with these key inputs:
- **Tiers**: Multiple subscription plans with monthly/quarterly/annual pricing, credits, and apparel costs
- **Billing Distribution**: % of subscribers on monthly vs quarterly vs annual billing
- **Product Costs**: Credit redemption rate, COGS ratio, fulfillment, shipping
- **Commission**: Upfront bonuses, residual %, residual delay (months before residual starts), accelerators for sales reps
- **Sales Channels**: D2D sales reps (starting count, sales/rep, growth rate) and sampler marketing (spend, cost, conversion, growth)
- **Partners**: Kickback revenue from partner brands
- **Operational Overhead**: Fixed monthly or milestone-scaled (auto-calculated from Operations data)
- **Profit Split**: Named parties with percentage splits of net channel profit (e.g., "HERD 60%", "Partner 40%")

Key outputs you can discuss:
- **MRR/ARR**: Monthly and annual recurring revenue
- **Margins**: Gross and net margin ($ and %)
- **LTV/CAC**: Lifetime value, customer acquisition cost, and ratio per tier
- **Breakeven**: Month when cumulative profit turns positive
- **24-Month Cohort Projection**: Month-by-month subscribers, revenue, costs, net profit, cumulative profit
- **P&L Statement**: Revenue, COGS, gross margin, commission, overhead, net income
- **Profit Split**: How net profit is distributed across defined parties
- **Per-Tier Metrics**: Revenue, COGS, margin per subscriber for each plan

When modifying assumptions, always explain the impact on key metrics. When comparing scenarios, highlight the most meaningful differences.`;

  return { extraPrompt, scenarioCount: scenarios.length };
}

// ─── Tool Handler ─────────────────────────────────────────────

export async function handleProjectionsToolCall(
  toolName: string,
  input: Record<string, unknown>,
  send: SendFn
): Promise<string | null> {
  switch (toolName) {
    case "list_scenarios": {
      const scenarios = await prisma.financialSnapshot.findMany({
        orderBy: { updatedAt: "desc" },
      });

      if (scenarios.length === 0) {
        return "No saved scenarios found. Use get_current_defaults to get live system data, then calculate_projection to model a scenario.";
      }

      return scenarios
        .map((s) => {
          const results = s.results as Record<string, unknown> | null;
          const mrr = results?.mrr as number | undefined;
          const netMarginPercent = results?.netMarginPercent as number | undefined;
          const breakeven = results?.operationBreakevenMonth as number | undefined;
          return `=== ${s.scenarioName} [${s.id}] ===
Updated: ${s.updatedAt.toISOString().split("T")[0]}
MRR: $${mrr?.toLocaleString() ?? "N/A"} | Net Margin: ${netMarginPercent?.toFixed(1) ?? "N/A"}% | Breakeven: Month ${breakeven ?? "N/A"}
${s.notes ? `Notes: ${s.notes}` : ""}`;
        })
        .join("\n\n");
    }

    case "get_scenario": {
      const id = input.scenarioId as string;
      const scenario = await prisma.financialSnapshot.findUnique({
        where: { id },
      });

      if (!scenario) return `Scenario not found: ${id}`;

      const assumptions = scenario.assumptions as Record<string, unknown>;
      const results = scenario.results as Record<string, unknown>;

      return `=== ${scenario.scenarioName} ===
ID: ${scenario.id}
Updated: ${scenario.updatedAt.toISOString()}
${scenario.notes ? `Notes: ${scenario.notes}\n` : ""}
--- ASSUMPTIONS ---
${JSON.stringify(assumptions, null, 2)}

--- RESULTS ---
${JSON.stringify(results, null, 2)}`;
    }

    case "calculate_projection": {
      try {
        const inputs = input.inputs as FinancialInputs;
        const results = calculateScenario(inputs);

        send("activity", {
          type: "created",
          label: "Calculated projection",
        });

        const profitSplitSummary = results.profitSplit.parties.length > 0
          ? `\n--- PROFIT SPLIT ---\n${results.profitSplit.parties.map((p) => `  ${p.name}: ${p.percent}% → $${p.monthlyAmount.toFixed(0)}/mo ($${p.annualAmount.toFixed(0)}/yr)`).join("\n")}\n  Undistributed: ${results.profitSplit.undistributedPercent}%`
          : "";

        return `=== PROJECTION RESULTS ===
MRR: $${results.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
ARR: $${results.arr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
Gross Margin: ${results.grossMarginPercent.toFixed(1)}% ($${results.grossMarginDollars.toFixed(0)}/mo)
Net Margin: ${results.netMarginPercent.toFixed(1)}% ($${results.netMarginDollars.toFixed(0)}/mo)

New Subscribers/Month: ${results.newSubscribersPerMonth} (${results.newSubsFromReps} from reps, ${results.newSubsFromSamplers} from samplers)
Cost per Subscriber: $${results.costPerSubscriber.toFixed(2)}
Commission: $${results.totalCommissionExpense.toFixed(0)}/mo (${results.commissionPercentOfRevenue.toFixed(1)}% of revenue)

LTV/CAC: ${results.ltvCac.ltvCacRatio.toFixed(1)}x (LTV: $${results.ltvCac.blendedLTV.toFixed(0)}, CAC: $${results.ltvCac.blendedCAC.toFixed(0)})
Payback: ${results.ltvCac.monthsToPayback.toFixed(1)} months
Breakeven: Month ${results.operationBreakevenMonth ?? "N/A"}

--- REVENUE BY TIER ---
${results.revenueByTier.map((t) => `  ${t.tierId}: $${t.revenue.toFixed(0)}/mo (${t.subscribers} subs)`).join("\n")}

--- 24-MONTH PROJECTION (Highlights) ---
Month 1: ${results.cohortProjection[0]?.subscribers ?? 0} subs, $${results.cohortProjection[0]?.revenue?.toFixed(0) ?? 0} rev, $${results.cohortProjection[0]?.netProfit?.toFixed(0) ?? 0} net
Month 6: ${results.cohortProjection[5]?.subscribers ?? 0} subs, $${results.cohortProjection[5]?.revenue?.toFixed(0) ?? 0} rev, $${results.cohortProjection[5]?.netProfit?.toFixed(0) ?? 0} net
Month 12: ${results.cohortProjection[11]?.subscribers ?? 0} subs, $${results.cohortProjection[11]?.revenue?.toFixed(0) ?? 0} rev, $${results.cohortProjection[11]?.netProfit?.toFixed(0) ?? 0} net
Month 24: ${results.cohortProjection[23]?.subscribers ?? 0} subs, $${results.cohortProjection[23]?.revenue?.toFixed(0) ?? 0} rev, $${results.cohortProjection[23]?.netProfit?.toFixed(0) ?? 0} net
Cumulative Profit at Month 24: $${results.cohortProjection[23]?.cumulativeProfit?.toFixed(0) ?? 0}
${profitSplitSummary}
--- FULL RESULTS (JSON) ---
${JSON.stringify(results, null, 2)}`;
      } catch (err) {
        return `Calculation error: ${err instanceof Error ? err.message : "Invalid inputs"}`;
      }
    }

    case "modify_assumptions": {
      const scenarioId = input.scenarioId as string;
      const changes = input.changes as Record<string, unknown>;

      const scenario = await prisma.financialSnapshot.findUnique({
        where: { id: scenarioId },
      });

      if (!scenario) return `Scenario not found: ${scenarioId}`;

      const currentInputs = scenario.assumptions as Record<string, unknown>;
      const merged = deepMerge(currentInputs, changes) as unknown as FinancialInputs;

      try {
        const results = calculateScenario(merged);

        send("activity", {
          type: "updated",
          label: `Recalculated "${scenario.scenarioName}" with modified assumptions`,
        });

        return `=== MODIFIED: ${scenario.scenarioName} ===
Changes applied: ${Object.keys(changes).join(", ")}

MRR: $${results.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
Net Margin: ${results.netMarginPercent.toFixed(1)}%
LTV/CAC: ${results.ltvCac.ltvCacRatio.toFixed(1)}x
Breakeven: Month ${results.operationBreakevenMonth ?? "N/A"}
Month 24 Cumulative Profit: $${results.cohortProjection[23]?.cumulativeProfit?.toFixed(0) ?? 0}

NOTE: These results are NOT yet saved. Use save_scenario with the modified inputs to persist.

--- MODIFIED INPUTS ---
${JSON.stringify(merged, null, 2)}

--- RESULTS ---
${JSON.stringify(results, null, 2)}`;
      } catch (err) {
        return `Calculation error after merging changes: ${err instanceof Error ? err.message : "Invalid merged inputs"}`;
      }
    }

    case "save_scenario": {
      const name = input.name as string;
      const inputs = input.inputs as FinancialInputs;
      const notes = input.notes as string | undefined;
      const scenarioId = input.scenarioId as string | undefined;

      let results;
      try {
        results = calculateScenario(inputs);
      } catch (err) {
        return `Cannot save — calculation error: ${err instanceof Error ? err.message : "Invalid inputs"}`;
      }

      if (scenarioId) {
        await prisma.financialSnapshot.update({
          where: { id: scenarioId },
          data: {
            scenarioName: name,
            assumptions: inputs as unknown as Prisma.InputJsonValue,
            results: results as unknown as Prisma.InputJsonValue,
            notes: notes ?? null,
          },
        });

        send("activity", {
          type: "updated",
          label: `Updated scenario "${name}"`,
        });
        send("scenario_saved", { scenarioId, name });

        return `Scenario "${name}" updated successfully [${scenarioId}]. MRR: $${results.mrr.toFixed(0)}, Net Margin: ${results.netMarginPercent.toFixed(1)}%`;
      } else {
        const created = await prisma.financialSnapshot.create({
          data: {
            scenarioName: name,
            assumptions: inputs as unknown as Prisma.InputJsonValue,
            results: results as unknown as Prisma.InputJsonValue,
            notes: notes ?? null,
          },
        });

        send("activity", {
          type: "created",
          label: `Created scenario "${name}"`,
        });
        send("scenario_saved", { scenarioId: created.id, name });

        return `Scenario "${name}" saved [${created.id}]. MRR: $${results.mrr.toFixed(0)}, Net Margin: ${results.netMarginPercent.toFixed(1)}%`;
      }
    }

    case "delete_scenario": {
      const id = input.scenarioId as string;
      const scenario = await prisma.financialSnapshot.findUnique({
        where: { id },
        select: { scenarioName: true },
      });

      if (!scenario) return `Scenario not found: ${id}`;

      await prisma.financialSnapshot.delete({ where: { id } });

      send("activity", {
        type: "deleted",
        label: `Deleted scenario "${scenario.scenarioName}"`,
      });
      send("scenario_deleted", { scenarioId: id });

      return `Deleted scenario "${scenario.scenarioName}" [${id}].`;
    }

    case "compare_scenarios": {
      const ids = input.scenarioIds as string[];
      if (ids.length < 2)
        return "Please provide at least 2 scenario IDs to compare.";

      const scenarios = await prisma.financialSnapshot.findMany({
        where: { id: { in: ids } },
      });

      if (scenarios.length < 2)
        return `Only found ${scenarios.length} of ${ids.length} scenarios. Check the IDs.`;

      const rows = scenarios.map((s) => {
        const r = s.results as Record<string, unknown>;
        const cohort = r.cohortProjection as Array<Record<string, number>> | undefined;
        return {
          name: s.scenarioName,
          mrr: (r.mrr as number) ?? 0,
          netMarginPercent: (r.netMarginPercent as number) ?? 0,
          ltvCacRatio: ((r.ltvCac as Record<string, number>)?.ltvCacRatio) ?? 0,
          breakeven: (r.operationBreakevenMonth as number) ?? null,
          month12Profit: cohort?.[11]?.cumulativeProfit ?? 0,
          month24Profit: cohort?.[23]?.cumulativeProfit ?? 0,
        };
      });

      send("activity", {
        type: "created",
        label: `Compared ${scenarios.length} scenarios`,
      });

      let table = "| Metric | " + rows.map((r) => r.name).join(" | ") + " |\n";
      table += "|--------|" + rows.map(() => "--------").join("|") + "|\n";
      table += `| MRR | ${rows.map((r) => `$${r.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`).join(" | ")} |\n`;
      table += `| Net Margin | ${rows.map((r) => `${r.netMarginPercent.toFixed(1)}%`).join(" | ")} |\n`;
      table += `| LTV:CAC | ${rows.map((r) => `${r.ltvCacRatio.toFixed(1)}x`).join(" | ")} |\n`;
      table += `| Breakeven | ${rows.map((r) => r.breakeven ? `Month ${r.breakeven}` : "N/A").join(" | ")} |\n`;
      table += `| 12mo Cum. Profit | ${rows.map((r) => `$${r.month12Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`).join(" | ")} |\n`;
      table += `| 24mo Cum. Profit | ${rows.map((r) => `$${r.month24Profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`).join(" | ")} |\n`;

      return table;
    }

    case "get_current_defaults": {
      try {
        const { getFinancialDefaults } = await import(
          "@/app/admin/financials/data"
        );
        const defaults = await getFinancialDefaults();

        send("activity", {
          type: "created",
          label: "Loaded current system defaults",
        });

        return `=== CURRENT SYSTEM DEFAULTS ===
Tiers: ${defaults.tierData.length} plans configured
${defaults.tierData.map((t) => `  - ${t.tierId}: $${t.monthlyPrice}/mo, $${t.quarterlyPricePerMonth}/qtr/mo, $${t.annualPricePerMonth}/yr/mo, ${t.monthlyCredits} credits`).join("\n")}

Commission: Flat $${defaults.commissionData.flatBonusPerSale}/sale, ${defaults.commissionData.residualPercent}% residual
Sales Reps: ${defaults.salesRepData.startingReps} starting, ${defaults.salesRepData.salesPerRepPerMonth} sales/rep/mo, ${defaults.salesRepData.monthlyGrowthRate}% growth
Samplers: $${defaults.samplerData.monthlyMarketingSpend}/mo spend, $${defaults.samplerData.costPerSampler}/sampler, ${defaults.samplerData.conversionRate}% conversion
Product COGS Ratio: ${defaults.productCOGSRatio}
Fulfillment: $${defaults.productFulfillmentCost}/order
Shipping: $${defaults.productShippingCost}/order
Overhead: $${defaults.overheadData.fixedMonthly}/mo (mode: ${defaults.overheadData.mode})
Partners: ${defaults.partnerData.length} configured

--- DATA SOURCE LINKAGES ---
${JSON.stringify(defaults.dataSourceMeta, null, 2)}

--- FULL DEFAULT INPUTS ---
Use these as the base for calculate_projection or save_scenario:
${JSON.stringify({
  tiers: defaults.tierData,
  billingCycleDistribution: { monthly: 70, quarterly: 20, annual: 10 },
  creditRedemptionRate: 0.75,
  avgCOGSToMemberPriceRatio: defaults.productCOGSRatio,
  breakageRate: 0.25,
  fulfillmentCostPerOrder: defaults.productFulfillmentCost,
  shippingCostPerOrder: defaults.productShippingCost,
  commissionStructure: defaults.commissionData,
  salesRepChannel: defaults.salesRepData,
  samplerChannel: defaults.samplerData,
  partnerKickbacks: defaults.partnerData,
  operationalOverhead: defaults.overheadData,
  profitSplitParties: [],
}, null, 2)}`;
      } catch (err) {
        return `Failed to load defaults: ${err instanceof Error ? err.message : "Unknown error"}`;
      }
    }

    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>
      );
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}
