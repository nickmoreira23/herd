"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const GOAL_KEYS: Record<string, string> = {
  WEIGHT_LOSS: "weight-loss",
  MUSCLE_GAIN: "muscle-gain",
  PERFORMANCE: "performance",
  ENDURANCE: "endurance",
  GENERAL_WELLNESS: "general-wellness",
  RECOVERY: "recovery",
  STRENGTH: "strength",
  BODY_RECOMP: "body-recomp",
  CUSTOM: "custom",
};

function getImagesForGoal(goal: string): { url: string; label: string }[] {
  const key = GOAL_KEYS[goal] || "custom";
  const label = goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return Array.from({ length: 12 }, (_, i) => ({
    url: i === 0
      ? `/images/packages/${key}.svg`
      : `/images/packages/${key}-${i + 1}.svg`,
    label: `${label} ${i + 1}`,
  }));
}

interface ImageSelectorProps {
  value: string | null;
  fitnessGoal: string;
  onChange: (url: string) => void;
}

export function ImageSelector({ value, fitnessGoal, onChange }: ImageSelectorProps) {
  const images = getImagesForGoal(fitnessGoal);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {images.map((opt, i) => {
        const isSelected = value === opt.url;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(opt.url)}
            className={cn(
              "relative rounded-xl overflow-hidden border-2 transition-all duration-200",
              "hover:shadow-sm aspect-[3/2]",
              isSelected
                ? "border-[#C5F135] shadow-sm ring-1 ring-[#C5F135]/30"
                : "border-border hover:border-border/80"
            )}
          >
            <img
              src={opt.url}
              alt={opt.label}
              className="h-full w-full object-cover"
            />
            {isSelected && (
              <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[#C5F135] flex items-center justify-center">
                <Check className="h-3 w-3 text-black" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
