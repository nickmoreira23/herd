"use client";

import { cn } from "@/lib/utils";
import {
  Scale,
  Dumbbell,
  Zap,
  Timer,
  Heart,
  Bed,
  Check,
  Shield,
  RefreshCcw,
  PenLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface GoalOption {
  value: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

const GOALS: GoalOption[] = [
  {
    value: "WEIGHT_LOSS",
    label: "Weight Loss",
    subtitle: "Fat burning & lean body",
    icon: Scale,
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  {
    value: "MUSCLE_GAIN",
    label: "Muscle Gain",
    subtitle: "Strength & mass building",
    icon: Dumbbell,
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    value: "PERFORMANCE",
    label: "Performance",
    subtitle: "Peak athletic output",
    icon: Zap,
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    value: "ENDURANCE",
    label: "Endurance",
    subtitle: "Stamina & long-distance",
    icon: Timer,
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  {
    value: "GENERAL_WELLNESS",
    label: "General Wellness",
    subtitle: "Overall health & vitality",
    icon: Heart,
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  {
    value: "RECOVERY",
    label: "Recovery",
    subtitle: "Rest & muscle repair",
    icon: Bed,
    bgColor: "bg-teal-50",
    textColor: "text-teal-600",
  },
  {
    value: "STRENGTH",
    label: "Strength",
    subtitle: "Power & heavy lifting",
    icon: Shield,
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
  },
  {
    value: "BODY_RECOMP",
    label: "Body Recomp",
    subtitle: "Lose fat & gain muscle",
    icon: RefreshCcw,
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    subtitle: "Describe your own goal",
    icon: PenLine,
    bgColor: "bg-zinc-50",
    textColor: "text-zinc-600",
  },
];

interface FitnessGoalPickerProps {
  value: string;
  customDescription: string;
  onChange: (goal: string) => void;
  onCustomDescriptionChange: (desc: string) => void;
}

export function FitnessGoalPicker({
  value,
  customDescription,
  onChange,
  onCustomDescriptionChange,
}: FitnessGoalPickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {GOALS.map((goal) => {
          const isSelected = value === goal.value;
          const Icon = goal.icon;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => onChange(goal.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                "hover:shadow-sm",
                isSelected
                  ? "border-[#C5F135] bg-[#C5F135]/5 shadow-sm"
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#C5F135] flex items-center justify-center">
                  <Check className="h-3 w-3 text-black" />
                </div>
              )}
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  goal.bgColor
                )}
              >
                <Icon className={cn("h-5 w-5", goal.textColor)} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{goal.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {goal.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom goal description input */}
      {value === "CUSTOM" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Describe your fitness goal
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => onCustomDescriptionChange(e.target.value)}
            placeholder="e.g., Training for a triathlon with focus on swim performance and lean muscle..."
            className="w-full text-sm bg-background rounded-lg border border-border px-3 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
