"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";

interface Props {
  onBack: () => void;
  goToStep: (step: number) => void;
}

export function StepReview({ onBack, goToStep }: Props) {
  const router = useRouter();
  const state = useMarketplaceWizardStore();
  const [submitting, setSubmitting] = useState(false);

  async function submit(action: "DRAFT" | "PUBLISH") {
    setSubmitting(true);
    try {
      const isEdit = !!state.sectionId;
      const url = isEdit
        ? `/api/marketplace/sections/${state.sectionId}`
        : "/api/marketplace/sections";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: state.slug,
          name: state.name,
          description: state.description || null,
          iconKey: state.iconKey,
          imageUrl: state.imageUrl,
          status: action === "PUBLISH" ? "PUBLISHED" : "DRAFT",
          creationPath: state.creationPath.toUpperCase(),
          blockNames: state.selectedBlockNames,
          components: state.components,
          layout: state.layout,
          scopes: state.scopes.map((s) => ({
            blockName: s.blockName,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue,
            sortOrder: s.sortOrder,
            allowedProfileTypeIds: s.allowedProfileTypeIds,
            allowedRoleIds: s.allowedRoleIds,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to save section");
        setSubmitting(false);
        return;
      }
      const savedId = (json.data?.id as string | undefined) ?? state.sectionId;
      toast.success(
        action === "PUBLISH"
          ? isEdit
            ? "Changes published"
            : "Section published"
          : isEdit
            ? "Changes saved as draft"
            : "Draft saved"
      );
      window.dispatchEvent(new Event("marketplace-sections-updated"));
      state.reset();
      router.push(savedId ? `/admin/marketplace/sections/${savedId}` : "/admin/marketplace");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save section");
      setSubmitting(false);
    }
  }

  const summary = [
    {
      label: "Blocks",
      value: state.selectedBlockNames.length
        ? state.selectedBlockNames.join(", ")
        : "—",
      step: 1,
    },
    {
      label: "Scopes",
      value: `${state.scopes.length} scope${state.scopes.length === 1 ? "" : "s"}`,
      step: 2,
    },
    {
      label: "Section page",
      value:
        state.components.length > 0
          ? `${state.components.length} component(s)`
          : "default layout",
      step: 3,
    },
    { label: "Identity", value: `${state.name} (/${state.slug})`, step: 4 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Review &amp; publish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Save as draft to finish later, or publish to make it visible in Explore.
          </p>
        </div>

        <div className="space-y-2">
          {summary.map((row) => (
            <Card
              key={row.label}
              className="flex items-center gap-3 p-3 px-4 text-sm"
            >
              <span className="font-medium w-32 shrink-0">{row.label}</span>
              <span className="flex-1 text-muted-foreground truncate">{row.value}</span>
              <Button variant="ghost" size="sm" onClick={() => goToStep(row.step)}>
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            </Card>
          ))}
        </div>

        <div className="rounded-md border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">
            Visibility per scope:&nbsp;
            {state.scopes.filter(
              (s) =>
                s.allowedProfileTypeIds.length > 0 || s.allowedRoleIds.length > 0
            ).length}{" "}
            of {state.scopes.length} scope(s) are restricted.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {state.scopes.map((s) => (
            <Badge key={s.clientId} variant="outline" className="text-[10px]">
              {s.blockName}: {s.scopeType.toLowerCase()}
              {s.scopeValue ? ` (${s.scopeValue.slice(0, 18)}${s.scopeValue.length > 18 ? "…" : ""})` : ""}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl gap-2">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => submit("DRAFT")}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save as draft
          </Button>
          <Button onClick={() => submit("PUBLISH")} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
