"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, Type } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import {
  TABLE_FIELD_TYPE_OPTIONS,
  TABLE_FIELD_TYPE_MAP,
} from "./cells";
import type { TableFieldRow, TableRow } from "./types";

const PRECISION_OPTIONS = ["0", "1", "2", "3", "4"] as const;

const CHOICE_COLORS = [
  "emerald",
  "blue",
  "purple",
  "orange",
  "red",
  "yellow",
  "pink",
  "cyan",
  "indigo",
  "zinc",
];

interface FieldConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  field?: TableFieldRow | null;
  onComplete: () => void;
}

export function FieldConfigModal({
  open,
  onOpenChange,
  tableId,
  field,
  onComplete,
}: FieldConfigModalProps) {
  const t = useT();
  const isEdit = !!field;

  const [name, setName] = useState("");
  const [type, setType] = useState("singleLineText");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Type-specific options
  const [precision, setPrecision] = useState("2");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [choices, setChoices] = useState<
    { id: string; name: string; color: string }[]
  >([]);
  const [newChoiceName, setNewChoiceName] = useState("");
  const [linkedTableId, setLinkedTableId] = useState("");
  const [availableTables, setAvailableTables] = useState<TableRow[]>(
    []
  );

  // Populate form when editing
  useEffect(() => {
    if (field) {
      setName(field.name);
      setType(field.type);
      setDescription(field.description || "");
      setIsRequired(field.isRequired);

      const opts = field.options || {};
      if (opts.precision !== undefined)
        setPrecision(String(opts.precision));
      if (opts.symbol) setCurrencySymbol(String(opts.symbol));
      if (opts.choices && Array.isArray(opts.choices))
        setChoices(
          opts.choices as { id: string; name: string; color: string }[]
        );
      if (opts.linkedTableId)
        setLinkedTableId(String(opts.linkedTableId));
    } else {
      resetForm();
    }
  }, [field, open]);

  // Fetch tables for linkedRecord picker
  useEffect(() => {
    if (type === "linkedRecord" && open) {
      fetch("/api/tables")
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.tables) {
            setAvailableTables(
              json.data.tables.filter(
                (t: TableRow) => t.id !== tableId
              )
            );
          }
        })
        .catch(() => {});
    }
  }, [type, open, tableId]);

  function resetForm() {
    setName("");
    setType("singleLineText");
    setDescription("");
    setIsRequired(false);
    setPrecision("2");
    setCurrencySymbol("$");
    setChoices([]);
    setNewChoiceName("");
    setLinkedTableId("");
    setSubmitting(false);
  }

  function buildOptions(): Record<string, unknown> | undefined {
    switch (type) {
      case "number":
        return { precision: parseInt(precision) };
      case "currency":
        return { precision: parseInt(precision), symbol: currencySymbol };
      case "percent":
        return { precision: parseInt(precision) };
      case "singleSelect":
      case "multiSelect":
        return { choices };
      case "linkedRecord":
        return { linkedTableId };
      default:
        return undefined;
    }
  }

  function addChoice() {
    if (!newChoiceName.trim()) return;
    const colorIndex = choices.length % CHOICE_COLORS.length;
    setChoices([
      ...choices,
      {
        id: crypto.randomUUID(),
        name: newChoiceName.trim(),
        color: CHOICE_COLORS[colorIndex],
      },
    ]);
    setNewChoiceName("");
  }

  function removeChoice(id: string) {
    setChoices(choices.filter((c) => c.id !== id));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      notifyError("error.tables.field_name_required", t);
      return;
    }

    if (type === "linkedRecord" && !linkedTableId) {
      notifyError("error.tables.linked_table_required", t);
      return;
    }

    setSubmitting(true);
    try {
      const options = buildOptions();
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        isRequired,
      };

      if (!isEdit) {
        body.type = type;
      }
      if (options) {
        body.options = options;
      }

      const url = isEdit
        ? `/api/tables/${tableId}/fields/${field!.id}`
        : `/api/tables/${tableId}/fields`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        notifyError(
          isEdit
            ? "error.tables.field_update_failed"
            : "error.tables.field_create_failed",
          t
        );
        return;
      }

      notifySuccess(
        isEdit
          ? "tables.feedback.field_updated"
          : "tables.feedback.field_added",
        t
      );
      resetForm();
      onOpenChange(false);
      onComplete();
    } catch (e) {
      console.error("Field submit error:", e);
      notifyError("error.tables.unexpected_error", t);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTypeMeta = TABLE_FIELD_TYPE_MAP[type];
  const SelectedIcon = selectedTypeMeta?.icon || Type;

  const showChoices = type === "singleSelect" || type === "multiSelect";
  const showPrecision =
    type === "number" || type === "currency" || type === "percent";
  const showCurrency = type === "currency";
  const showLinkedRecord = type === "linkedRecord";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v);
          if (!v) resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("tables.field_config.title_edit")
              : t("tables.field_config.title_add")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("tables.field_config.name_label")}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("tables.field_config.name_placeholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("tables.field_config.type_label")}
            </Label>
            <Select
              value={type}
              onValueChange={(val) => val && setType(val)}
              disabled={isEdit}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  <SelectedIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedTypeMeta ? t(selectedTypeMeta.labelKey) : type}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TABLE_FIELD_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {t(opt.labelKey)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("tables.field_config.description_label")}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tables.field_config.description_placeholder")}
              rows={2}
            />
          </div>

          {/* Type-specific options */}
          {showPrecision && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("tables.field_config.precision_label")}
              </Label>
              <Select
                value={precision}
                onValueChange={(val) => val && setPrecision(val)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value === "0"
                        ? t("tables.field_config.precision_integer")
                        : value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showCurrency && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("tables.field_config.currency_symbol_label")}
              </Label>
              <Input
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="$"
                className="w-20"
              />
            </div>
          )}

          {showChoices && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("tables.field_config.choices_label")}
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {choices.map((choice) => (
                  <Badge
                    key={choice.id}
                    variant="outline"
                    className={`text-xs bg-${choice.color}-500/10 text-${choice.color}-500 border-${choice.color}-500/20`}
                  >
                    {choice.name}
                    <button
                      onClick={() => removeChoice(choice.id)}
                      aria-label={t("tables.field_config.remove_choice")}
                      className="ml-1 hover:opacity-70"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newChoiceName}
                  onChange={(e) => setNewChoiceName(e.target.value)}
                  placeholder={t("tables.field_config.add_choice_placeholder")}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChoice();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addChoice}
                  disabled={!newChoiceName.trim()}
                  aria-label={t("tables.field_config.add_choice")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {showLinkedRecord && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("tables.field_config.link_to_table_label")}
              </Label>
              {availableTables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("tables.field_config.no_tables_available")}
                </p>
              ) : (
                <Select
                  value={linkedTableId}
                  onValueChange={(val) => val && setLinkedTableId(val)}
                  disabled={isEdit}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue
                      placeholder={t(
                        "tables.field_config.select_table_placeholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((tbl) => (
                      <SelectItem key={tbl.id} value={tbl.id}>
                        {tbl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="field-required"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="field-required" className="text-xs cursor-pointer">
              {t("tables.field_config.required_field")}
            </Label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                {isEdit
                  ? t("tables.field_config.updating")
                  : t("tables.field_config.adding")}
              </>
            ) : isEdit ? (
              t("tables.field_config.update_button")
            ) : (
              t("tables.field_config.add_button")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
