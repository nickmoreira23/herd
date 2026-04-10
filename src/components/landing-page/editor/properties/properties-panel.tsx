"use client";

import { PanelRightClose, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingPageEditorStore } from "@/stores/landing-page-editor-store";
import { getComponentDefinition } from "@/lib/landing-page/registry";
import { TextProp } from "./prop-editors/text-prop";
import { TextareaProp } from "./prop-editors/textarea-prop";
import { NumberProp } from "./prop-editors/number-prop";
import { SelectProp } from "./prop-editors/select-prop";
import { BooleanProp } from "./prop-editors/boolean-prop";
import { ColorProp } from "./prop-editors/color-prop";
import { UrlProp } from "./prop-editors/url-prop";
import { ItemsProp } from "./prop-editors/items-prop";
import { ImageProp } from "./prop-editors/image-prop";
import { IconPickerProp } from "./prop-editors/icon-picker-prop";
import { StyleEditor } from "./style-editor";
import { SectionProperties } from "./section-properties";
import type { PropField } from "@/types/landing-page";

export function PropertiesPanel() {
  const selectedSectionId = useLandingPageEditorStore((s) => s.selectedSectionId);
  const selectedComponentId = useLandingPageEditorStore((s) => s.selectedComponentId);
  const setRightPanelOpen = useLandingPageEditorStore((s) => s.setRightPanelOpen);
  const updateComponentProps = useLandingPageEditorStore((s) => s.updateComponentProps);
  const updateComponentStyles = useLandingPageEditorStore((s) => s.updateComponentStyles);
  const removeComponent = useLandingPageEditorStore((s) => s.removeComponent);
  const duplicateComponent = useLandingPageEditorStore((s) => s.duplicateComponent);

  // Inline selectors that react to data changes (not just selection changes)
  const component = useLandingPageEditorStore((s) => {
    if (!s.selectedSectionId || !s.selectedComponentId) return undefined;
    const sec = s.sections.find((sec) => sec.id === s.selectedSectionId);
    return sec?.components.find((c) => c.id === s.selectedComponentId);
  });

  const section = useLandingPageEditorStore((s) => {
    if (!s.selectedSectionId) return undefined;
    return s.sections.find((sec) => sec.id === s.selectedSectionId);
  });

  const definition = component ? getComponentDefinition(component.type) : undefined;

  const handlePropChange = (key: string, value: unknown) => {
    if (!selectedSectionId || !selectedComponentId) return;
    updateComponentProps(selectedSectionId, selectedComponentId, { [key]: value });
  };

  const renderPropField = (field: PropField) => {
    if (!component) return null;
    const currentValue = component.props[field.key] ?? field.defaultValue;

    switch (field.type) {
      case "text":
        return (
          <TextProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
            placeholder={field.placeholder}
          />
        );
      case "icon":
        return (
          <IconPickerProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
          />
        );
      case "image":
        return (
          <ImageProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
            placeholder={field.placeholder}
          />
        );
      case "textarea":
      case "richtext":
        return (
          <TextareaProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
            placeholder={field.placeholder}
          />
        );
      case "number":
        return (
          <NumberProp
            key={field.key}
            label={field.label}
            value={Number(currentValue ?? 0)}
            onChange={(v) => handlePropChange(field.key, v)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
      case "select":
        return (
          <SelectProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
            options={field.options ?? []}
          />
        );
      case "boolean":
        return (
          <BooleanProp
            key={field.key}
            label={field.label}
            value={Boolean(currentValue)}
            onChange={(v) => handlePropChange(field.key, v)}
          />
        );
      case "color":
        return (
          <ColorProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
          />
        );
      case "url":
        return (
          <UrlProp
            key={field.key}
            label={field.label}
            value={String(currentValue ?? "")}
            onChange={(v) => handlePropChange(field.key, v)}
            placeholder={field.placeholder}
          />
        );
      case "items":
        return (
          <ItemsProp
            key={field.key}
            label={field.label}
            value={(currentValue as string[]) ?? []}
            onChange={(v) => handlePropChange(field.key, v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {component ? (definition?.label || component.type) : section ? "Section" : "Properties"}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setRightPanelOpen(false)}
          title="Close panel"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Nothing selected */}
        {!selectedSectionId && !selectedComponentId && (
          <p className="text-xs text-muted-foreground">
            Select a section or component to edit its properties.
          </p>
        )}

        {/* Section selected (no component) */}
        {selectedSectionId && !selectedComponentId && section && (
          <SectionProperties section={section} />
        )}

        {/* Component selected */}
        {component && definition && (
          <>
            {/* Content props */}
            {definition.propsSchema.filter((f) => !f.group || f.group === "content").length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Content
                </p>
                {definition.propsSchema
                  .filter((f) => !f.group || f.group === "content")
                  .map(renderPropField)}
              </div>
            )}

            {/* Style props from schema */}
            {definition.propsSchema.filter((f) => f.group === "style").length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Style
                </p>
                {definition.propsSchema
                  .filter((f) => f.group === "style")
                  .map(renderPropField)}
              </div>
            )}

            {/* Visual style editor */}
            <StyleEditor
              styles={component.styles}
              onChange={(styles) => {
                if (selectedSectionId && selectedComponentId) {
                  updateComponentStyles(selectedSectionId, selectedComponentId, styles);
                }
              }}
            />

            {/* Advanced props */}
            {definition.propsSchema.filter((f) => f.group === "advanced").length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Advanced
                </p>
                {definition.propsSchema
                  .filter((f) => f.group === "advanced")
                  .map(renderPropField)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => {
                  if (selectedSectionId && selectedComponentId) {
                    duplicateComponent(selectedSectionId, selectedComponentId);
                  }
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  if (selectedSectionId && selectedComponentId) {
                    removeComponent(selectedSectionId, selectedComponentId);
                  }
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
