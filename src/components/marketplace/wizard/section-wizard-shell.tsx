"use client";

import { useEffect } from "react";
import { WizardProgress } from "@/components/network/profiles/wizard/wizard-progress";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";
import type { EligibleBlock } from "@/lib/marketplace/types";
import type { ComponentNode } from "@/types/landing-page";
import type { BlockCategory } from "@/lib/blocks/block-categories";
import { StepBlock } from "./step-block";
import { StepItems } from "./step-items";
import { StepSection } from "./step-section";
import { StepIdentity } from "./step-identity";
import { StepReview } from "./step-review";

interface ProfileTypeOption {
  id: string;
  displayName: string;
}
interface RoleOption {
  id: string;
  displayName: string;
}

export interface InitialSectionForEdit {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  creationPath: string;
  status: string;
  blockNames: string[];
  components: ComponentNode[];
  scopes: Array<{
    id: string;
    blockName: string;
    scopeType: "ALL" | "CATEGORY" | "SUB_CATEGORY" | "ITEM";
    scopeValue: string | null;
    sortOrder: number;
    allowedProfileTypeIds: string[];
    allowedRoleIds: string[];
  }>;
}

interface SectionWizardShellProps {
  eligibleBlocks: EligibleBlock[];
  profileTypes: ProfileTypeOption[];
  roles: RoleOption[];
  blockCategories: BlockCategory[];
  /** When provided, the wizard hydrates state from this section instead of resetting. */
  initialSection?: InitialSectionForEdit;
}

const STEP_LABELS: Record<number, string> = {
  1: "Blocks",
  2: "Items",
  3: "Section",
  4: "Identity",
  5: "Review",
};

const STEPS = [1, 2, 3, 4, 5];

export function SectionWizardShell({
  eligibleBlocks,
  profileTypes,
  roles,
  blockCategories,
  initialSection,
}: SectionWizardShellProps) {
  const { currentStep, completedSteps, setStep, markStepComplete, reset } =
    useMarketplaceWizardStore();

  useEffect(() => {
    if (initialSection) {
      // Hydrate the wizard with the section's persisted state.
      reset();
      const store = useMarketplaceWizardStore.getState();
      store.setSectionId(initialSection.id);
      store.setName(initialSection.name);
      store.setSlug(initialSection.slug);
      store.setDescription(initialSection.description ?? "");
      store.setImageUrl(initialSection.imageUrl);
      store.setIconKey(initialSection.iconKey);
      store.setCreationPath(
        (initialSection.creationPath.toLowerCase() as
          | "manual"
          | "copilot"
          | "autonomous") ?? "manual"
      );
      store.setSelectedBlocks(initialSection.blockNames);
      store.setComponents(initialSection.components);
      // Re-add scopes
      for (const sc of initialSection.scopes) {
        store.addScope({
          clientId: `cs_${sc.id.slice(0, 8)}`,
          id: sc.id,
          blockName: sc.blockName,
          scopeType: sc.scopeType,
          scopeValue: sc.scopeValue,
          sortOrder: sc.sortOrder,
          allowedProfileTypeIds: sc.allowedProfileTypeIds,
          allowedRoleIds: sc.allowedRoleIds,
        });
      }
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSection?.id]);

  const progressSteps = STEPS.map((n) => ({ number: n, label: STEP_LABELS[n] }));

  function handleNext() {
    markStepComplete(currentStep);
    const nextIdx = STEPS.indexOf(currentStep) + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  }

  function handleBack() {
    const prevIdx = STEPS.indexOf(currentStep) - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
  }

  function goToStep(step: number) {
    setStep(step);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <WizardProgress
          steps={progressSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
      </div>

      {currentStep === 1 && (
        <StepBlock
          eligibleBlocks={eligibleBlocks}
          categories={blockCategories}
          onNext={handleNext}
        />
      )}
      {currentStep === 2 && (
        <StepItems
          eligibleBlocks={eligibleBlocks}
          profileTypes={profileTypes}
          roles={roles}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}
      {currentStep === 3 && <StepSection onNext={handleNext} onBack={handleBack} />}
      {currentStep === 4 && <StepIdentity onNext={handleNext} onBack={handleBack} />}
      {currentStep === 5 && <StepReview onBack={handleBack} goToStep={goToStep} />}
    </div>
  );
}
