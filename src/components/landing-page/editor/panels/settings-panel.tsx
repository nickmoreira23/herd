"use client";

import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { ColorProp } from "../properties/prop-editors/color-prop";
import { TextProp } from "../properties/prop-editors/text-prop";
import { NumberProp } from "../properties/prop-editors/number-prop";
import { SelectProp } from "../properties/prop-editors/select-prop";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 w-full text-[11px] font-medium text-muted-foreground uppercase tracking-wider py-1 hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="space-y-3 pl-1 pt-1">{children}</div>}
    </div>
  );
}

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Poppins", value: "Poppins" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Space Grotesk", value: "Space Grotesk" },
];

const WEIGHT_OPTIONS = [
  { label: "Light (300)", value: "300" },
  { label: "Normal (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semibold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extra Bold (800)", value: "800" },
];

export function SettingsPanel() {
  const pageStyles = useLandingPageEditorStore((s) => s.pageStyles);
  const updatePageStyles = useLandingPageEditorStore((s) => s.updatePageStyles);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Page Settings
      </p>

      <Section title="Colors" defaultOpen>
        <ColorProp
          label="Primary"
          value={pageStyles.colors.primary}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, primary: v } })}
        />
        <ColorProp
          label="Secondary"
          value={pageStyles.colors.secondary}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, secondary: v } })}
        />
        <ColorProp
          label="Accent"
          value={pageStyles.colors.accent}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, accent: v } })}
        />
        <ColorProp
          label="Background"
          value={pageStyles.colors.background}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, background: v } })}
        />
        <ColorProp
          label="Text"
          value={pageStyles.colors.text}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, text: v } })}
        />
        <ColorProp
          label="Muted"
          value={pageStyles.colors.muted}
          onChange={(v) => updatePageStyles({ colors: { ...pageStyles.colors, muted: v } })}
        />
      </Section>

      <Section title="Typography">
        <SelectProp
          label="Heading Font"
          value={pageStyles.fonts.heading.family}
          onChange={(v) =>
            updatePageStyles({ fonts: { ...pageStyles.fonts, heading: { ...pageStyles.fonts.heading, family: v } } })
          }
          options={FONT_OPTIONS}
        />
        <SelectProp
          label="Heading Weight"
          value={pageStyles.fonts.heading.weight}
          onChange={(v) =>
            updatePageStyles({ fonts: { ...pageStyles.fonts, heading: { ...pageStyles.fonts.heading, weight: v } } })
          }
          options={WEIGHT_OPTIONS}
        />
        <SelectProp
          label="Body Font"
          value={pageStyles.fonts.body.family}
          onChange={(v) =>
            updatePageStyles({ fonts: { ...pageStyles.fonts, body: { ...pageStyles.fonts.body, family: v } } })
          }
          options={FONT_OPTIONS}
        />
        <SelectProp
          label="Body Weight"
          value={pageStyles.fonts.body.weight}
          onChange={(v) =>
            updatePageStyles({ fonts: { ...pageStyles.fonts, body: { ...pageStyles.fonts.body, weight: v } } })
          }
          options={WEIGHT_OPTIONS}
        />
      </Section>

      <Section title="Spacing">
        <NumberProp
          label="Section Gap (px)"
          value={pageStyles.spacing.sectionGap}
          onChange={(v) => updatePageStyles({ spacing: { ...pageStyles.spacing, sectionGap: v } })}
          min={0}
          max={200}
        />
        <NumberProp
          label="Container Max Width (px)"
          value={pageStyles.spacing.containerMaxWidth}
          onChange={(v) => updatePageStyles({ spacing: { ...pageStyles.spacing, containerMaxWidth: v } })}
          min={600}
          max={2400}
          step={50}
        />
        <NumberProp
          label="Container Padding (px)"
          value={pageStyles.spacing.containerPadding}
          onChange={(v) => updatePageStyles({ spacing: { ...pageStyles.spacing, containerPadding: v } })}
          min={0}
          max={100}
        />
      </Section>

      <Section title="Border & Radius">
        <NumberProp
          label="Border Radius (px)"
          value={pageStyles.borderRadius}
          onChange={(v) => updatePageStyles({ borderRadius: v })}
          min={0}
          max={50}
        />
      </Section>
    </div>
  );
}
