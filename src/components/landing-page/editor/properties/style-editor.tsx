"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberProp } from "./prop-editors/number-prop";
import { TextProp } from "./prop-editors/text-prop";
import { SelectProp } from "./prop-editors/select-prop";
import { ColorProp } from "./prop-editors/color-prop";
import { SpacingProp } from "./prop-editors/spacing-prop";
import type { ComponentStyles, SpacingBox } from "@/types/landing-page";

interface StyleEditorProps {
  styles: ComponentStyles;
  onChange: (styles: Partial<ComponentStyles>) => void;
}

function CollapsibleSection({
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
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
      </button>
      {open && <div className="space-y-3 pl-1 pt-1">{children}</div>}
    </div>
  );
}

export function StyleEditor({ styles, onChange }: StyleEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Styles
      </p>

      {/* Spacing */}
      <CollapsibleSection title="Spacing">
        <SpacingProp
          label="Margin"
          value={styles.margin}
          onChange={(margin) => onChange({ margin })}
        />
        <SpacingProp
          label="Padding"
          value={styles.padding}
          onChange={(padding) => onChange({ padding })}
        />
      </CollapsibleSection>

      {/* Size */}
      <CollapsibleSection title="Size">
        <TextProp
          label="Width"
          value={styles.width || "auto"}
          onChange={(width) => onChange({ width })}
          placeholder="auto, 100%, 200px"
        />
        <TextProp
          label="Height"
          value={styles.height || "auto"}
          onChange={(height) => onChange({ height })}
          placeholder="auto, 100%, 200px"
        />
        <TextProp
          label="Max Width"
          value={styles.maxWidth || ""}
          onChange={(maxWidth) => onChange({ maxWidth })}
          placeholder="100%, 1200px"
        />
      </CollapsibleSection>

      {/* Typography */}
      <CollapsibleSection title="Typography">
        <NumberProp
          label="Font Size"
          value={styles.fontSize || 16}
          onChange={(fontSize) => onChange({ fontSize })}
          min={8}
          max={120}
        />
        <SelectProp
          label="Font Weight"
          value={styles.fontWeight || "400"}
          onChange={(fontWeight) => onChange({ fontWeight })}
          options={[
            { label: "Light (300)", value: "300" },
            { label: "Normal (400)", value: "400" },
            { label: "Medium (500)", value: "500" },
            { label: "Semibold (600)", value: "600" },
            { label: "Bold (700)", value: "700" },
            { label: "Extra Bold (800)", value: "800" },
          ]}
        />
        <NumberProp
          label="Line Height"
          value={styles.lineHeight || 1.5}
          onChange={(lineHeight) => onChange({ lineHeight })}
          min={0.5}
          max={3}
          step={0.1}
        />
        <NumberProp
          label="Letter Spacing"
          value={styles.letterSpacing || 0}
          onChange={(letterSpacing) => onChange({ letterSpacing })}
          min={-5}
          max={20}
          step={0.1}
        />
        <SelectProp
          label="Text Align"
          value={styles.textAlign || "left"}
          onChange={(textAlign) => onChange({ textAlign: textAlign as ComponentStyles["textAlign"] })}
          options={[
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ]}
        />
        <ColorProp
          label="Text Color"
          value={styles.color || ""}
          onChange={(color) => onChange({ color })}
        />
      </CollapsibleSection>

      {/* Background */}
      <CollapsibleSection title="Background">
        <ColorProp
          label="Background Color"
          value={styles.backgroundColor || ""}
          onChange={(backgroundColor) => onChange({ backgroundColor })}
        />
      </CollapsibleSection>

      {/* Border */}
      <CollapsibleSection title="Border">
        <NumberProp
          label="Border Width"
          value={styles.borderWidth || 0}
          onChange={(borderWidth) => onChange({ borderWidth })}
          min={0}
          max={20}
        />
        <ColorProp
          label="Border Color"
          value={styles.borderColor || ""}
          onChange={(borderColor) => onChange({ borderColor })}
        />
        <NumberProp
          label="Border Radius"
          value={styles.borderRadius || 0}
          onChange={(borderRadius) => onChange({ borderRadius })}
          min={0}
          max={100}
        />
        <SelectProp
          label="Border Style"
          value={styles.borderStyle || "solid"}
          onChange={(borderStyle) => onChange({ borderStyle })}
          options={[
            { label: "None", value: "none" },
            { label: "Solid", value: "solid" },
            { label: "Dashed", value: "dashed" },
            { label: "Dotted", value: "dotted" },
          ]}
        />
      </CollapsibleSection>

      {/* Effects */}
      <CollapsibleSection title="Effects">
        <NumberProp
          label="Opacity"
          value={styles.opacity ?? 1}
          onChange={(opacity) => onChange({ opacity })}
          min={0}
          max={1}
          step={0.05}
        />
        <TextProp
          label="Box Shadow"
          value={styles.boxShadow || ""}
          onChange={(boxShadow) => onChange({ boxShadow })}
          placeholder="0 4px 6px rgba(0,0,0,0.1)"
        />
      </CollapsibleSection>
    </div>
  );
}
