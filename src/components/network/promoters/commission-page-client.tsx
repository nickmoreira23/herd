"use client";

import type { SubscriptionTier } from "@/types";
import { CommissionSimulator } from "./commission-simulator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, Building2, FileText, ArrowUpRight, Zap, BookOpen, BarChart3 } from "lucide-react";
import { CommissionPlansTab } from "./tabs/commission-plans-tab";
import { D2DPartnersTab } from "./tabs/d2d-partners-tab";
import { AgreementsTab } from "./tabs/agreements-tab";
import { OverridesTab } from "./tabs/overrides-tab";
import { AcceleratorsTab } from "./tabs/accelerators-tab";
import { LedgerTab } from "./tabs/ledger-tab";

// Keep legacy types for the simulator
import type { CommissionStructure, CommissionTierRate } from "@/types";

type StructureWithRates = CommissionStructure & {
  tierRates: (CommissionTierRate & { subscriptionTier: SubscriptionTier })[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CommissionPageClientProps {
  tiers: SubscriptionTier[];
  plans: any[];
  d2dPartners: any[];
  agreements: any[];
  ledgerSummary: any;
  // Legacy — for simulator backward compat
  initialStructures: StructureWithRates[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function CommissionPageClient({
  tiers,
  plans,
  d2dPartners,
  agreements,
  ledgerSummary,
  initialStructures,
}: CommissionPageClientProps) {
  const activeStructure = initialStructures.find((s) => s.isActive) || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partnerOptions = d2dPartners.map((p: any) => ({ id: p.id, name: p.name }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planOptions = plans.map((p: any) => ({ id: p.id, name: p.name, version: p.version }));

  return (
    <Tabs defaultValue="plans">
      <TabsList className="flex-wrap">
        <TabsTrigger value="plans" className="gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Plans
        </TabsTrigger>
        <TabsTrigger value="partners" className="gap-1.5">
          <Building2 className="h-3.5 w-3.5" />
          Partners
        </TabsTrigger>
        <TabsTrigger value="agreements" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Agreements
        </TabsTrigger>
        <TabsTrigger value="overrides" className="gap-1.5">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Overrides
        </TabsTrigger>
        <TabsTrigger value="accelerators" className="gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          Accelerators
        </TabsTrigger>
        <TabsTrigger value="ledger" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Ledger
        </TabsTrigger>
        <TabsTrigger value="simulator" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Simulator
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plans">
        <CommissionPlansTab initialPlans={plans} tiers={tiers} />
      </TabsContent>

      <TabsContent value="partners">
        <D2DPartnersTab initialPartners={d2dPartners} />
      </TabsContent>

      <TabsContent value="agreements">
        <AgreementsTab initialAgreements={agreements} partners={partnerOptions} plans={planOptions} />
      </TabsContent>

      <TabsContent value="overrides">
        <OverridesTab plans={plans} />
      </TabsContent>

      <TabsContent value="accelerators">
        <AcceleratorsTab plans={plans} />
      </TabsContent>

      <TabsContent value="ledger">
        <LedgerTab initialSummary={ledgerSummary} partners={partnerOptions} />
      </TabsContent>

      <TabsContent value="simulator">
        <CommissionSimulator
          structure={activeStructure}
          tiers={tiers}
        />
      </TabsContent>
    </Tabs>
  );
}
