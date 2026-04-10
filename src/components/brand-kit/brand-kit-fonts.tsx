"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BrandKitSection } from "./brand-kit-section";
import { BrandKitEmptyState } from "./brand-kit-empty-state";
import { useBrandKitSection } from "@/hooks/use-brand-kit-section";
import {
  FONT_KEYS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  DEFAULT_FONT_ROLES,
  FONT_ROLE_LABELS,
  type FontRoleConfig,
} from "@/lib/brand-kit-settings";
import { Type, Check, X, Bold, Italic, Trash2, Plus } from "lucide-react";

function loadGoogleFont(family: string, weight: string) {
  if (typeof document === "undefined") return;
  const id = `gfont-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@0,${weight};1,${weight}&display=swap`;
  document.head.appendChild(link);
}

export function BrandKitFonts() {
  const { settings, set, save, saving, loading } =
    useBrandKitSection(FONT_KEYS);

  const [roles, setRoles] = useState<Record<string, FontRoleConfig>>({});
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FontRoleConfig | null>(null);

  // Parse roles from settings on load
  useEffect(() => {
    if (settings.brandFontRoles) {
      try {
        const parsed = JSON.parse(settings.brandFontRoles);
        setRoles(parsed);
      } catch {
        setRoles({ ...DEFAULT_FONT_ROLES });
      }
    } else {
      setRoles({ ...DEFAULT_FONT_ROLES });
    }
  }, [settings.brandFontRoles]);

  // Load Google Fonts for all configured fonts
  useEffect(() => {
    const families = new Set<string>();
    for (const config of Object.values(roles)) {
      families.add(`${config.family}:${config.weight}`);
    }
    families.forEach((f) => {
      const [family, weight] = f.split(":");
      loadGoogleFont(family, weight);
    });
  }, [roles]);

  const syncRoles = useCallback(
    (updated: Record<string, FontRoleConfig>) => {
      setRoles(updated);
      set("brandFontRoles", JSON.stringify(updated));
    },
    [set]
  );

  const startEdit = (roleKey: string) => {
    setEditingRole(roleKey);
    setEditDraft({ ...roles[roleKey] });
    loadGoogleFont(roles[roleKey].family, roles[roleKey].weight);
  };

  const confirmEdit = () => {
    if (!editingRole || !editDraft) return;
    const updated = { ...roles, [editingRole]: editDraft };
    syncRoles(updated);
    setEditingRole(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditDraft(null);
  };

  const deleteRole = (roleKey: string) => {
    const updated = { ...roles };
    delete updated[roleKey];
    syncRoles(updated);
  };

  const addDefaultRoles = () => {
    syncRoles({ ...DEFAULT_FONT_ROLES });
  };

  const isEmpty = Object.keys(roles).length === 0;

  const roleOrder = [
    "title",
    "subtitle",
    "heading",
    "subheading",
    "body",
    "caption",
    "quote",
  ];
  const sortedRoles = roleOrder.filter((r) => r in roles);

  return (
    <BrandKitSection
      title="Fonts"
      description="Define typography for each text role in your system."
      saving={saving}
      loading={loading}
      onSave={save}
      actions={
        !isEmpty ? (
          <Button
            variant="outline"
            size="sm"
            onClick={addDefaultRoles}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Reset to defaults
          </Button>
        ) : undefined
      }
    >
      {isEmpty ? (
        <BrandKitEmptyState
          icon={Type}
          title="No font styles configured"
          description="Define how each text role looks across your system — from page titles to body copy. Choose fonts, sizes, and weights for a cohesive typographic identity."
          actionLabel="Set up default font styles"
          onAction={addDefaultRoles}
        />
      ) : (
        <div className="rounded-lg border bg-card divide-y divide-border">
          {sortedRoles.map((roleKey) => {
            const config = roles[roleKey];
            const isEditing = editingRole === roleKey;
            const label = FONT_ROLE_LABELS[roleKey] || roleKey;

            if (isEditing && editDraft) {
              return (
                <FontRoleEditor
                  key={roleKey}
                  label={label}
                  draft={editDraft}
                  onChange={setEditDraft}
                  onConfirm={confirmEdit}
                  onCancel={cancelEdit}
                />
              );
            }

            return (
              <FontRoleRow
                key={roleKey}
                label={label}
                config={config}
                onClick={() => startEdit(roleKey)}
                onDelete={() => deleteRole(roleKey)}
              />
            );
          })}
        </div>
      )}
    </BrandKitSection>
  );
}

// ─── Font Role Row (display mode) ───────────────────────────────────────────

function FontRoleRow({
  label,
  config,
  onClick,
  onDelete,
}: {
  label: string;
  config: FontRoleConfig;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={onClick}
    >
      <span
        style={{
          fontFamily: `"${config.family}", sans-serif`,
          fontSize: `${Math.min(Number(config.size), 32)}px`,
          fontWeight: config.weight,
          fontStyle: config.italic ? "italic" : "normal",
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {config.family} &middot; {config.weight} &middot; {config.size}px
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Font Role Editor (inline edit mode) ────────────────────────────────────

function FontRoleEditor({
  label,
  draft,
  onChange,
  onConfirm,
  onCancel,
}: {
  label: string;
  draft: FontRoleConfig;
  onChange: (d: FontRoleConfig) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const updateDraft = (partial: Partial<FontRoleConfig>) => {
    const updated = { ...draft, ...partial };
    onChange(updated);
    if (partial.family || partial.weight) {
      loadGoogleFont(
        partial.family || draft.family,
        partial.weight || draft.weight
      );
    }
  };

  return (
    <div className="px-5 py-4 bg-muted/20 space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Font</span>
          <Select
            value={draft.family}
            onValueChange={(val) => updateDraft({ family: val ?? draft.family })}
          >
            <SelectTrigger className="w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Weight</span>
          <Select
            value={draft.weight}
            onValueChange={(val) => updateDraft({ weight: val ?? draft.weight })}
          >
            <SelectTrigger className="w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHT_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Size</span>
          <Select
            value={draft.size}
            onValueChange={(val) => updateDraft({ size: val ?? draft.size })}
          >
            <SelectTrigger className="w-24 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => updateDraft({ weight: draft.weight === "700" ? "400" : "700" })}
          className={`h-8 w-8 rounded flex items-center justify-center border transition-colors ${
            Number(draft.weight) >= 700
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-muted"
          }`}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => updateDraft({ italic: !draft.italic })}
          className={`h-8 w-8 rounded flex items-center justify-center border transition-colors ${
            draft.italic
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:bg-muted"
          }`}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preview + confirm/cancel */}
      <div className="flex items-center justify-between">
        <span
          className="border-b-2 border-primary pb-0.5"
          style={{
            fontFamily: `"${draft.family}", sans-serif`,
            fontSize: `${Math.min(Number(draft.size), 32)}px`,
            fontWeight: draft.weight,
            fontStyle: draft.italic ? "italic" : "normal",
          }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onConfirm}
            className="h-8 w-8 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
