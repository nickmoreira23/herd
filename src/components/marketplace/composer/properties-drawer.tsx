"use client";

import { X, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMarketplaceWizardStore } from "@/stores/marketplace-section-wizard-store";
import { getMarketplaceComponent } from "@/lib/marketplace/component-registry";
import type { PropField, ComponentNode } from "@/types/landing-page";

import { TextProp } from "@/components/landing-page/editor/properties/prop-editors/text-prop";
import { TextareaProp } from "@/components/landing-page/editor/properties/prop-editors/textarea-prop";
import { NumberProp } from "@/components/landing-page/editor/properties/prop-editors/number-prop";
import { SelectProp } from "@/components/landing-page/editor/properties/prop-editors/select-prop";
import { BooleanProp } from "@/components/landing-page/editor/properties/prop-editors/boolean-prop";
import { ColorProp } from "@/components/landing-page/editor/properties/prop-editors/color-prop";
import { UrlProp } from "@/components/landing-page/editor/properties/prop-editors/url-prop";
import { ImageProp } from "@/components/landing-page/editor/properties/prop-editors/image-prop";
import { CollectionItemsEditor } from "./collection-items-editor";

interface Props {
  /** When provided, show a "block" select limited to the section's selected blocks. */
  blockNames: string[];
}

export function PropertiesDrawer({ blockNames }: Props) {
  const selectedId = useMarketplaceWizardStore((s) => s.selectedComponentId);
  const component = useMarketplaceWizardStore((s) =>
    s.components.find((c) => c.id === selectedId)
  );
  const updateProps = useMarketplaceWizardStore((s) => s.updateComponentProps);
  const remove = useMarketplaceWizardStore((s) => s.removeComponent);
  const duplicate = useMarketplaceWizardStore((s) => s.duplicateComponent);
  const select = useMarketplaceWizardStore((s) => s.selectComponent);

  if (!component) {
    return (
      <div className="w-72 shrink-0 border-l bg-card overflow-y-auto p-4">
        <p className="text-xs text-muted-foreground">
          Select a component on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  const def = getMarketplaceComponent(component.type);
  if (!def) {
    return null;
  }

  const groups: Record<string, PropField[]> = {
    content: [],
    style: [],
    advanced: [],
  };
  for (const field of def.propsSchema) {
    const g = field.group ?? "content";
    groups[g] ??= [];
    groups[g].push(field);
  }

  return (
    <div className="w-80 shrink-0 border-l bg-card overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{def.label}</p>
          <p className="text-[11px] text-muted-foreground capitalize">{def.category}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => duplicate(component.id)} title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(component.id)}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => select(null)} title="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {(["content", "style", "advanced"] as const).map((groupKey) => {
          const fields = groups[groupKey] ?? [];
          if (fields.length === 0) return null;
          return (
            <div key={groupKey} className="space-y-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {groupKey}
              </p>
              {fields.map((f) =>
                renderField(f, component, blockNames, (next) =>
                  updateProps(component.id, next)
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderField(
  f: PropField,
  component: ComponentNode,
  blockNames: string[],
  patch: (next: Record<string, unknown>) => void
) {
  const value = component.props[f.key];

  // Special-case: blockName field — when the section has selected blocks,
  // render as a select limited to those.
  if (f.key === "blockName" && blockNames.length > 0) {
    return (
      <SelectProp
        key={f.key}
        label={f.label}
        value={typeof value === "string" ? value : ""}
        onChange={(v) => patch({ blockName: v })}
        options={blockNames.map((b) => ({ label: b, value: b }))}
      />
    );
  }

  // Collection items widget.
  if (f.key === "itemIds" && component.type === "mkt.colecao") {
    return (
      <CollectionItemsEditor
        key={f.key}
        blockName={(component.props.blockName as string) ?? ""}
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={(itemIds) => patch({ itemIds })}
      />
    );
  }

  switch (f.type) {
    case "text":
      return (
        <TextProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => patch({ [f.key]: v })}
          placeholder={f.placeholder}
        />
      );
    case "textarea":
      return (
        <TextareaProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => patch({ [f.key]: v })}
          placeholder={f.placeholder}
        />
      );
    case "number":
      return (
        <NumberProp
          key={f.key}
          label={f.label}
          value={typeof value === "number" ? value : Number(f.defaultValue) || 0}
          onChange={(v) => patch({ [f.key]: v })}
          min={f.validation?.min}
          max={f.validation?.max}
        />
      );
    case "select":
      return (
        <SelectProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : String(f.defaultValue ?? "")}
          onChange={(v) => patch({ [f.key]: v })}
          options={f.options ?? []}
        />
      );
    case "boolean":
      return (
        <BooleanProp
          key={f.key}
          label={f.label}
          value={Boolean(value)}
          onChange={(v) => patch({ [f.key]: v })}
        />
      );
    case "color":
      return (
        <ColorProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : "#000000"}
          onChange={(v) => patch({ [f.key]: v })}
        />
      );
    case "url":
      return (
        <UrlProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => patch({ [f.key]: v })}
        />
      );
    case "image":
      return (
        <ImageProp
          key={f.key}
          label={f.label}
          value={typeof value === "string" ? value : ""}
          onChange={(v) => patch({ [f.key]: v })}
        />
      );
    default:
      return (
        <div key={f.key} className="text-xs text-muted-foreground">
          <Label>{f.label}</Label>
          <p className="italic">Editor for &ldquo;{f.type}&rdquo; not available yet.</p>
        </div>
      );
  }
}
