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
import {
  Loader2,
  Plus,
  X,
  Type,
  AlignLeft,
  Hash,
  List,
  ListChecks,
  CheckSquare,
  Calendar,
  Link2,
  Mail,
  DollarSign,
  Percent,
  ArrowUpRight,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeTableFieldRow, KnowledgeTableRow } from "./types";

const FIELD_TYPE_OPTIONS = [
  { value: "singleLineText", label: "Single Line Text", icon: Type },
  { value: "multilineText", label: "Long Text", icon: AlignLeft },
  { value: "number", label: "Number", icon: Hash },
  { value: "singleSelect", label: "Single Select", icon: List },
  { value: "multiSelect", label: "Multi Select", icon: ListChecks },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "date", label: "Date", icon: Calendar },
  { value: "url", label: "URL", icon: Link2 },
  { value: "email", label: "Email", icon: Mail },
  { value: "currency", label: "Currency", icon: DollarSign },
  { value: "percent", label: "Percent", icon: Percent },
  { value: "linkedRecord", label: "Linked Record", icon: ArrowUpRight },
  { value: "media", label: "Media (Image/Video)", icon: ImageIcon },
] as const;

const FIELD_TYPE_MAP = Object.fromEntries(
  FIELD_TYPE_OPTIONS.map((opt) => [opt.value, opt])
);

const PRECISION_OPTIONS = [
  { value: "0", label: "0 (Integer)" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
];

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

interface KnowledgeFieldConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  field?: KnowledgeTableFieldRow | null;
  onComplete: () => void;
}

export function KnowledgeFieldConfigModal({
  open,
  onOpenChange,
  tableId,
  field,
  onComplete,
}: KnowledgeFieldConfigModalProps) {
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
  const [availableTables, setAvailableTables] = useState<KnowledgeTableRow[]>(
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
      fetch("/api/knowledge/tables")
        .then((r) => r.json())
        .then((json) => {
          if (json.data?.tables) {
            setAvailableTables(
              json.data.tables.filter(
                (t: KnowledgeTableRow) => t.id !== tableId
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
      toast.error("Field name is required");
      return;
    }

    if (type === "linkedRecord" && !linkedTableId) {
      toast.error("Please select a table to link to");
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
        ? `/api/knowledge/tables/${tableId}/fields/${field!.id}`
        : `/api/knowledge/tables/${tableId}/fields`;

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || `Failed to ${isEdit ? "update" : "add"} field`);
        return;
      }

      toast.success(isEdit ? "Field updated" : "Field added");
      resetForm();
      onOpenChange(false);
      onComplete();
    } catch (e) {
      console.error("Field submit error:", e);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedType = FIELD_TYPE_MAP[type];
  const SelectedIcon = selectedType?.icon || Type;

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
          <DialogTitle>{isEdit ? "Edit Field" : "Add Field"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Price, Status, Email"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select
              value={type}
              onValueChange={(val) => val && setType(val)}
              disabled={isEdit}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue>
                  <SelectedIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {selectedType?.label || type}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {opt.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this field store?"
              rows={2}
            />
          </div>

          {/* Type-specific options */}
          {showPrecision && (
            <div className="space-y-1.5">
              <Label className="text-xs">Decimal Precision</Label>
              <Select
                value={precision}
                onValueChange={(val) => val && setPrecision(val)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showCurrency && (
            <div className="space-y-1.5">
              <Label className="text-xs">Currency Symbol</Label>
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
              <Label className="text-xs">Choices</Label>
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
                  placeholder="Add a choice..."
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
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {showLinkedRecord && (
            <div className="space-y-1.5">
              <Label className="text-xs">Link to Table</Label>
              {availableTables.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No other tables available to link to. Create another table
                  first.
                </p>
              ) : (
                <Select
                  value={linkedTableId}
                  onValueChange={(val) => val && setLinkedTableId(val)}
                  disabled={isEdit}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a table..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
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
              Required field
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
                {isEdit ? "Updating..." : "Adding..."}
              </>
            ) : isEdit ? (
              "Update Field"
            ) : (
              "Add Field"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
