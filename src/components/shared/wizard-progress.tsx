"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface WizardProgressProps {
  steps: { number: number; label: string }[]
  currentStep: number
  completedSteps: Set<number>
}

export function WizardProgress({
  steps,
  currentStep,
  completedSteps,
}: WizardProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connector line — spans center of first step to center of last */}
        <div
          className="absolute top-4 h-px bg-border z-0"
          style={{
            left: `${(0.5 / steps.length) * 100}%`,
            right: `${(0.5 / steps.length) * 100}%`,
          }}
        />

        {steps.map(({ number, label }) => {
          const isCompleted = completedSteps.has(number)
          const isActive = currentStep === number

          return (
            <div
              key={number}
              className="flex flex-col items-center gap-2 relative z-10"
              style={{ minWidth: 0, flex: 1 }}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary bg-background"
                    : "border-border text-muted-foreground bg-background"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{number}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-xs text-center leading-tight",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
