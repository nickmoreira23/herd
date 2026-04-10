"use client";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandKitSection } from "./brand-kit-section";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import { APPEARANCE_KEYS } from "@/lib/brand-kit-settings";

const SHADOW_MAP: Record<string, { card: string; modal: string }> = {
  none: { card: "none", modal: "none" },
  subtle: {
    card: "0 1px 2px rgba(0,0,0,0.05)",
    modal: "0 2px 4px rgba(0,0,0,0.05)",
  },
  medium: {
    card: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    modal: "0 4px 12px rgba(0,0,0,0.1)",
  },
  strong: {
    card: "0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
    modal: "0 10px 25px rgba(0,0,0,0.15)",
  },
};

export function BrandKitAppearance() {
  const { settings, set, save, saving, loading } =
    useBrandKitSection(APPEARANCE_KEYS);

  const borderRadius = settings.brandBorderRadius || "8";
  const shadowIntensity = settings.brandShadowIntensity || "medium";
  const contentDensity = settings.brandContentDensity || "comfortable";
  const animationSpeed = settings.brandAnimationSpeed || "normal";
  const shadows = SHADOW_MAP[shadowIntensity] || SHADOW_MAP.medium;

  return (
    <BrandKitSection
      title="Appearance"
      description="Fine-tune the overall look and feel of your entire system."
      saving={saving}
      loading={loading}
      onSave={save}
    >
      <div className="space-y-6">
        {/* Border Radius */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Global Border Radius</CardTitle>
            <CardDescription>
              Default radius for cards, inputs, and other UI elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Slider
                value={[Number(borderRadius)]}
                onValueChange={(v) =>
                  set(
                    "brandBorderRadius",
                    String(Array.isArray(v) ? v[0] : v)
                  )
                }
                min={0}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono text-muted-foreground w-10 text-right">
                {borderRadius}px
              </span>
            </div>
            {/* Shape previews */}
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 border-2 border-muted-foreground/30"
                style={{ borderRadius: `${borderRadius}px` }}
              />
              <div
                className="h-14 w-24 border-2 border-muted-foreground/30"
                style={{ borderRadius: `${borderRadius}px` }}
              />
              <div
                className="h-10 w-36 border-2 border-muted-foreground/30"
                style={{ borderRadius: `${borderRadius}px` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shadow Intensity */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Shadow Intensity</CardTitle>
            <CardDescription>
              Controls drop shadow depth on cards and modals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={shadowIntensity}
              onValueChange={(val) =>
                set("brandShadowIntensity", val ?? "medium")
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="subtle">Subtle</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
              </SelectContent>
            </Select>
            {/* Shadow preview */}
            <div className="flex items-center gap-6">
              {[
                { label: "Card", shadow: shadows.card },
                { label: "Modal", shadow: shadows.modal },
              ].map((item) => (
                <div
                  key={item.label}
                  className="h-16 w-28 rounded-lg border bg-card flex items-center justify-center"
                  style={{
                    boxShadow: item.shadow,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Density & Animation Speed */}
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Content Density</CardTitle>
              <CardDescription>
                Controls spacing between elements throughout the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={contentDensity}
                onValueChange={(val) =>
                  set("brandContentDensity", val ?? "comfortable")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="spacious">Spacious</SelectItem>
                </SelectContent>
              </Select>
              {/* Density preview */}
              <div className="space-y-0 pt-2">
                {["compact", "comfortable", "spacious"].map((d) => (
                  <div
                    key={d}
                    className={`flex items-center gap-2 text-xs transition-colors rounded px-2 ${
                      d === contentDensity
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                    style={{
                      paddingTop:
                        d === "compact"
                          ? "4px"
                          : d === "comfortable"
                            ? "8px"
                            : "12px",
                      paddingBottom:
                        d === "compact"
                          ? "4px"
                          : d === "comfortable"
                            ? "8px"
                            : "12px",
                    }}
                  >
                    <div
                      className={`h-3 w-3 rounded-sm border ${
                        d === contentDensity
                          ? "border-primary bg-primary/20"
                          : "border-muted-foreground/30"
                      }`}
                    />
                    <span className="capitalize">{d}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Animation Speed</CardTitle>
              <CardDescription>
                Transition speed for hover effects, modals, and page
                transitions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={animationSpeed}
                onValueChange={(val) =>
                  set("brandAnimationSpeed", val ?? "normal")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Disabled</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="slow">Relaxed</SelectItem>
                </SelectContent>
              </Select>
              {/* Speed indicator */}
              <div className="flex items-center gap-4 pt-2">
                {["none", "fast", "normal", "slow"].map((s) => {
                  const ms =
                    s === "none"
                      ? "0ms"
                      : s === "fast"
                        ? "100ms"
                        : s === "normal"
                          ? "200ms"
                          : "400ms";
                  return (
                    <div
                      key={s}
                      className={`flex flex-col items-center gap-1 text-xs ${
                        s === animationSpeed
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          s === animationSpeed
                            ? "bg-primary"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <span>{ms}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BrandKitSection>
  );
}
