"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CreationPathPicker } from "./creation-path-picker";
import { usePackageWizardStore } from "@/stores/package-wizard-store";

interface StepModeProps {
  onNext: () => void;
}

export function StepMode({ onNext }: StepModeProps) {
  const router = useRouter();
  const { creationPath, setCreationPath } = usePackageWizardStore();

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">How would you like to build?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your level of AI assistance.
          </p>
        </div>

        <CreationPathPicker value={creationPath} onChange={setCreationPath} />
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/program/packages")}
        >
          Cancel
        </Button>
        <Button onClick={onNext}>
          <ArrowRight className="h-4 w-4 mr-2" />
          Next: Goal
        </Button>
      </div>
    </div>
  );
}
