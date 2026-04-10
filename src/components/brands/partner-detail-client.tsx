"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PartnerStatusBadge } from "./partner-status-badge";
import { PartnerFormModal } from "./partner-form-modal";
import {
  ArrowLeft,
  Globe,
  ExternalLink,
  Pencil,
  Link2,
  Check,
} from "lucide-react";
import { toNumber, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerDetailClientProps {
  partner: PartnerWithAssignments;
  allTiers: SubscriptionTier[];
}

const STATUS_NEXT: Record<string, string> = {
  RESEARCHED: "APPLIED",
  APPLIED: "APPROVED",
  APPROVED: "ACTIVE",
};

const STATUS_NEXT_LABEL: Record<string, string> = {
  RESEARCHED: "Mark as Applied",
  APPLIED: "Mark as Approved",
  APPROVED: "Activate",
};

export function PartnerDetailClient({ partner: initialPartner, allTiers }: PartnerDetailClientProps) {
  const [partner, setPartner] = useState(initialPartner);
  const [showEdit, setShowEdit] = useState(false);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/partners/${partner.id}`);
    const json = await res.json();
    if (json.data) setPartner(json.data);
  }, [partner.id]);

  async function handleStatusAdvance() {
    const next = STATUS_NEXT[partner.status];
    if (!next) return;
    const res = await fetch(`/api/partners/${partner.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error || "Failed to update status");
      return;
    }
    toast.success(`Status updated to ${next}`);
    await refresh();
  }

  async function handlePause() {
    const nextStatus = partner.status === "PAUSED" ? "ACTIVE" : "PAUSED";
    const res = await fetch(`/api/partners/${partner.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error || "Failed");
      return;
    }
    toast.success(nextStatus === "PAUSED" ? "Paused" : "Reactivated");
    await refresh();
  }

  async function handleSave(data: Record<string, unknown>) {
    const res = await fetch(`/api/partners/${partner.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error || "Failed to save");
      return;
    }
    toast.success("Updated");
    await refresh();
  }

  async function handleTierToggle(tierId: string, currentlyActive: boolean) {
    const res = await fetch("/api/partners/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignments: [
          {
            partnerBrandId: partner.id,
            subscriptionTierId: tierId,
            discountPercent: currentlyActive
              ? 0
              : partner.tierAssignments.find((a) => a.subscriptionTierId === tierId)
                  ?.discountPercent ?? 0,
            isActive: !currentlyActive,
          },
        ],
      }),
    });
    if (res.ok) {
      toast.success(currentlyActive ? "Tier removed" : "Tier added");
      await refresh();
    }
  }

  async function handleDiscountChange(tierId: string, discountPercent: number) {
    const res = await fetch("/api/partners/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignments: [
          {
            partnerBrandId: partner.id,
            subscriptionTierId: tierId,
            discountPercent,
            isActive: true,
          },
        ],
      }),
    });
    if (res.ok) {
      toast.success("Discount updated");
      await refresh();
    }
  }

  const activeAssignments = partner.tierAssignments.filter((a) => a.isActive);
  void activeAssignments; // TODO: will be used for tier access display

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/brands")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {partner.logoUrl ? (
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">
                {partner.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{partner.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{partner.category}</Badge>
                <PartnerStatusBadge status={partner.status} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {STATUS_NEXT[partner.status] && (
            <Button size="sm" onClick={handleStatusAdvance}>
              {STATUS_NEXT_LABEL[partner.status]}
            </Button>
          )}
          {(partner.status === "ACTIVE" || partner.status === "PAUSED") && (
            <Button variant="outline" size="sm" onClick={handlePause}>
              {partner.status === "PAUSED" ? "Reactivate" : "Pause"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tagline */}
      {partner.tagline && (
        <p className="text-muted-foreground italic">{partner.tagline}</p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate Program</TabsTrigger>
          <TabsTrigger value="tiers">Tier Assignments</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-4">
            {/* Audience Benefit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audience Benefit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partner.audienceBenefit && (
                  <div className="rounded bg-green-50 px-3 py-2 font-medium text-green-800 dark:bg-green-500/10 dark:text-green-400">
                    {partner.audienceBenefit}
                  </div>
                )}
                {partner.benefitType && (
                  <div className="text-sm text-muted-foreground">
                    Type: {partner.benefitType.replace(/_/g, " ").toLowerCase()}
                  </div>
                )}
                {partner.description && (
                  <p className="text-sm">{partner.description}</p>
                )}
                {partner.discountDescription && (
                  <p className="text-sm text-muted-foreground">{partner.discountDescription}</p>
                )}
              </CardContent>
            </Card>

            {/* Kickback / HERD Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Kickback (HERD Cost)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{partner.kickbackType.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value</span>
                    <p className="font-medium">
                      {partner.kickbackValue
                        ? partner.kickbackType === "PERCENT_OF_SALE"
                          ? `${toNumber(partner.kickbackValue)}%`
                          : formatCurrency(toNumber(partner.kickbackValue))
                        : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {partner.websiteUrl && (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <Globe className="h-3 w-3" /> {partner.websiteUrl}
                  </a>
                )}
                {partner.scrapedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last scraped: {new Date(partner.scrapedAt).toLocaleDateString()}
                  </p>
                )}
                {!partner.websiteUrl && (
                  <p className="text-sm text-muted-foreground">No website URL set</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {partner.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{partner.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Affiliate Tab */}
        <TabsContent value="affiliate">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commission Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Commission Rate</span>
                    <p className="font-medium">{partner.commissionRate || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commission Type</span>
                    <p className="font-medium">{partner.commissionType || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Affiliate Network</span>
                    <p className="font-medium">{partner.affiliateNetwork || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cookie Duration</span>
                    <p className="font-medium">{partner.cookieDuration || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Affiliate Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partner.affiliateSignupUrl ? (
                  <a
                    href={partner.affiliateSignupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Affiliate Signup Page
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">No signup URL set</p>
                )}

                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">Affiliate Link / Code</span>
                  {partner.affiliateLinkPlaceholder ? (
                    <div className="flex items-center gap-1 mt-1 text-sm text-green-700 dark:text-green-400">
                      <Link2 className="h-3 w-3" /> {partner.affiliateLinkPlaceholder}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">Not set yet</p>
                  )}
                </div>

                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">Tier Access Level</span>
                  <p className="text-sm font-medium mt-1">{partner.tierAccess}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tiers Tab */}
        <TabsContent value="tiers">
          <div className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tier Discount Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allTiers.map((tier) => {
                    const assignment = partner.tierAssignments.find(
                      (a) => a.subscriptionTierId === tier.id && a.isActive
                    );
                    const isAssigned = !!assignment;

                    return (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTierToggle(tier.id, isAssigned)}
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              isAssigned
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground/30 hover:border-foreground/50"
                            }`}
                          >
                            {isAssigned && <Check className="h-3 w-3" />}
                          </button>
                          <div>
                            <span className="text-sm font-medium">{tier.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {formatCurrency(toNumber(tier.monthlyPrice))}/mo
                            </span>
                          </div>
                        </div>
                        {isAssigned && assignment && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Discount:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              defaultValue={toNumber(assignment.discountPercent)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== toNumber(assignment.discountPercent)) {
                                  handleDiscountChange(tier.id, val);
                                }
                              }}
                              className="w-16 rounded border bg-transparent px-2 py-1 text-right text-sm tabular-nums"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {allTiers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No subscription tiers found. Create tiers first.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PartnerFormModal
        partner={partner}
        open={showEdit}
        onOpenChange={setShowEdit}
        onSave={handleSave}
      />
    </div>
  );
}
