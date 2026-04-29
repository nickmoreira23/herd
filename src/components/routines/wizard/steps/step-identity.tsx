"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { useRoutineWizardStore } from "@/stores/routine-wizard-store";
import { InfoTip } from "@/components/tiers/info-tip";

interface StepIdentityProps {
  onNext: () => void;
  canProceed: boolean;
}

export function StepIdentity({ onNext, canProceed }: StepIdentityProps) {
  const t = useT();
  const { name, description, tags, setName, setDescription, setTags } =
    useRoutineWizardStore();
  const [tagInput, setTagInput] = useState("");

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput("");
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            {t("routines.wizard.steps.identity")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("routines.wizard.identity.subtitle")}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("routines.fields.name")}
            <InfoTip text={t("routines.tooltip.name")} />
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("routines.wizard.identity.namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("routines.fields.description")}{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
            <InfoTip text={t("routines.tooltip.description")} />
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("routines.wizard.identity.descriptionPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("routines.fields.tags")}
            <InfoTip text={t("routines.tooltip.tags")} />
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== tag))}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={t("common.tags.add")}
              className="h-7 w-40 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button onClick={onNext} disabled={!canProceed}>
          {t("routines.wizard.next")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
