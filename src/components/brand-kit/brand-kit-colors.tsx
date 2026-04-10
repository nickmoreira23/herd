"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandKitSection } from "./brand-kit-section";
import { BrandKitEmptyState } from "./brand-kit-empty-state";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import { COLOR_KEYS, generateShades } from "@/lib/brand-kit-settings";
import { Palette, Moon } from "lucide-react";

export function BrandKitColors() {
  const { settings, set, save, saving, loading, isEmpty } =
    useBrandKitSection(COLOR_KEYS);

  const primaryColor = settings.brandAccentColor || "#e22726";
  const secondaryColor = settings.brandSecondaryColor || "#e22726";
  const primaryShades = generateShades(primaryColor);
  const secondaryShades = generateShades(secondaryColor);

  return (
    <BrandKitSection
      title="Colors"
      description="Define your brand's color palette used across the entire system."
      saving={saving}
      loading={loading}
      onSave={save}
    >
      {isEmpty ? (
        <BrandKitEmptyState
          icon={Palette}
          title="No colors configured yet"
          description="Define your brand's color palette to create a consistent visual identity. Set primary, secondary, and status colors that will be applied system-wide."
          actionLabel="Set up your palette"
          onAction={() =>
            document.querySelector<HTMLInputElement>("#color-primary")?.click()
          }
        />
      ) : null}

      <div className="space-y-8">
        {/* Primary Color */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Primary</CardTitle>
            <CardDescription>
              Your main brand color, used for buttons, links, and key accents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="color-primary"
                type="color"
                value={primaryColor}
                onChange={(e) => set("brandAccentColor", e.target.value)}
                className="h-10 w-14 rounded border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => set("brandAccentColor", e.target.value)}
                className="w-32 font-mono text-sm"
              />
            </div>
            <ShadeStrip shades={primaryShades} />
          </CardContent>
        </Card>

        {/* Secondary Color */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Secondary</CardTitle>
            <CardDescription>
              Complementary color for secondary actions and highlights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => set("brandSecondaryColor", e.target.value)}
                className="h-10 w-14 rounded border cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => set("brandSecondaryColor", e.target.value)}
                className="w-32 font-mono text-sm"
              />
            </div>
            <ShadeStrip shades={secondaryShades} />
          </CardContent>
        </Card>

        {/* Status Colors */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Status Colors</CardTitle>
            <CardDescription>
              Used for success, warning, and error states throughout the
              system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  key: "brandSuccessColor",
                  label: "Success",
                  fallback: "#22c55e",
                },
                {
                  key: "brandWarningColor",
                  label: "Warning",
                  fallback: "#eab308",
                },
                {
                  key: "brandErrorColor",
                  label: "Error",
                  fallback: "#ef4444",
                },
              ].map((item) => (
                <div key={item.key}>
                  <Label className="text-xs font-medium text-muted-foreground">
                    {item.label}
                  </Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <input
                      type="color"
                      value={settings[item.key] || item.fallback}
                      onChange={(e) => set(item.key, e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={settings[item.key] || item.fallback}
                      onChange={(e) => set(item.key, e.target.value)}
                      className="w-28 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dark Mode Overrides */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">Dark Mode Overrides</h3>
              <p className="text-xs text-muted-foreground">
                Override colors for dark mode. Defaults to light mode values if
                not set.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                key: "brandDarkPrimaryColor",
                label: "Primary (Dark)",
                fallback: primaryColor,
              },
              {
                key: "brandDarkSecondaryColor",
                label: "Secondary (Dark)",
                fallback: secondaryColor,
              },
              {
                key: "brandDarkBgColor",
                label: "Background",
                fallback: "#0a0a0a",
              },
              {
                key: "brandDarkSurfaceColor",
                label: "Surface",
                fallback: "#171717",
              },
            ].map((item) => (
              <div key={item.key}>
                <Label className="text-sm font-medium">{item.label}</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input
                    type="color"
                    value={settings[item.key] || item.fallback}
                    onChange={(e) => set(item.key, e.target.value)}
                    className="h-10 w-14 rounded border cursor-pointer"
                  />
                  <Input
                    value={settings[item.key] || item.fallback}
                    onChange={(e) => set(item.key, e.target.value)}
                    className="w-32 font-mono text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrandKitSection>
  );
}

// ─── Shade Strip ─────────────────────────────────────────────────────────────

function ShadeStrip({
  shades,
}: {
  shades: { shade: number; color: string }[];
}) {
  return (
    <div>
      <div className="flex rounded-md overflow-hidden">
        {shades.map(({ shade, color }) => (
          <div
            key={shade}
            className="flex-1 h-10"
            style={{ backgroundColor: color }}
            title={`${shade}: ${color}`}
          />
        ))}
      </div>
      <div className="flex mt-1">
        {shades.map(({ shade, color }) => (
          <div key={shade} className="flex-1 text-center">
            <p className="text-[9px] text-muted-foreground">{shade}</p>
            <p className="text-[8px] text-muted-foreground font-mono">
              {color}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
