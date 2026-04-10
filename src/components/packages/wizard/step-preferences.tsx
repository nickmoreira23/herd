"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Pill, Shirt, Backpack } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePackageWizardStore } from "@/stores/package-wizard-store";

interface StepPreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

const CATEGORIES = [
  {
    key: "supplements" as const,
    label: "Supplements",
    icon: Pill,
    description: "Protein, pre-workout, vitamins, recovery",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  {
    key: "apparel" as const,
    label: "Apparel",
    icon: Shirt,
    description: "Tees, hoodies, shorts, hats",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    key: "accessories" as const,
    label: "Accessories",
    icon: Backpack,
    description: "Shaker bottles, bags, gear",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
];

export function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
  const { preferences, setPreferences } = usePackageWizardStore();

  function handleSliderChange(
    key: "supplements" | "apparel" | "accessories",
    value: number
  ) {
    const other1Key =
      key === "supplements"
        ? "apparel"
        : key === "apparel"
          ? "supplements"
          : "supplements";
    const other2Key =
      key === "supplements"
        ? "accessories"
        : key === "apparel"
          ? "accessories"
          : "apparel";

    const remaining = 100 - value;
    const otherTotal = preferences[other1Key] + preferences[other2Key];

    let newOther1: number;
    let newOther2: number;

    if (otherTotal === 0) {
      newOther1 = Math.round(remaining / 2);
      newOther2 = remaining - newOther1;
    } else {
      newOther1 = Math.round((preferences[other1Key] / otherTotal) * remaining);
      newOther2 = remaining - newOther1;
    }

    setPreferences({
      ...preferences,
      [key]: value,
      [other1Key]: Math.max(0, newOther1),
      [other2Key]: Math.max(0, newOther2),
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Budget Preferences</h2>
          <p className="text-sm text-muted-foreground mt-1">
            How would you like to distribute the monthly credit budget across
            product categories?
          </p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const value = preferences[cat.key];

            return (
              <div key={cat.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg ${cat.bg} flex items-center justify-center`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${cat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold tabular-nums w-14 text-right">
                    {value}%
                  </span>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(val) => handleSliderChange(cat.key, Array.isArray(val) ? val[0] : val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

        {/* Visual summary */}
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${preferences.supplements}%` }}
            />
            <div
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${preferences.apparel}%` }}
            />
            <div
              className="bg-purple-500 transition-all duration-300"
              style={{ width: `${preferences.accessories}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Supplements
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Apparel
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              Accessories
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/30 rounded-b-xl">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          <ArrowRight className="h-4 w-4 mr-2" />
          Next: Analysis
        </Button>
      </div>
    </div>
  );
}
