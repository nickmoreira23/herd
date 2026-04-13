"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Perk } from "@/types";
import { PERK_STATUSES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
  Gem,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────

export interface PerkFormState {
  name: string;
  key: string;
  description: string;
  longDescription: string;
  icon: string;
  status: string;
  sortOrder: string;
  tags: string;
  hasSubConfig: boolean;
  subConfigLabel: string;
  subConfigType: string;
  subConfigOptions: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function perkToForm(perk: Perk): PerkFormState {
  const p = perk as Record<string, unknown>;
  return {
    name: perk.name,
    key: perk.key,
    description: perk.description || "",
    longDescription: (p.longDescription as string) || "",
    icon: perk.icon,
    status: perk.status,
    sortOrder: String(perk.sortOrder),
    tags: (perk.tags as string[]).join(", "),
    hasSubConfig: perk.hasSubConfig,
    subConfigLabel: (p.subConfigLabel as string) || "",
    subConfigType: (p.subConfigType as string) || "number",
    subConfigOptions: ((p.subConfigOptions as string[]) || []).join(", "),
  };
}

function formToPayload(form: PerkFormState) {
  return {
    name: form.name,
    key: form.key,
    description: form.description || undefined,
    longDescription: form.longDescription || undefined,
    icon: form.icon || "gift",
    status: form.status,
    sortOrder: parseInt(form.sortOrder) || 0,
    tags: form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    hasSubConfig: form.hasSubConfig,
    subConfigLabel: form.hasSubConfig ? form.subConfigLabel || undefined : undefined,
    subConfigType: form.hasSubConfig ? form.subConfigType || undefined : undefined,
    subConfigOptions: form.hasSubConfig
      ? form.subConfigOptions
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-1.5 py-0">
          Active
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] px-1.5 py-0">
          Draft
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[11px] px-1.5 py-0">
          Archived
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Props ──────────────────────────────────────────────────────────

interface PerkDetailClientProps {
  perkId?: string;
  initialPerk?: Perk;
  allTiers?: { id: string; name: string }[];
  prefill?: Partial<PerkFormState>;
}

// ─── Component ──────────────────────────────────────────────────────

export function PerkDetailClient({
  perkId,
  initialPerk,
  allTiers,
  prefill,
}: PerkDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<PerkFormState>(() => {
    if (initialPerk) return perkToForm(initialPerk);
    if (prefill) {
      const merged = { ...DEFAULT_FORM, ...prefill };
      if (merged.name && !prefill.key) merged.key = toSlug(merged.name);
      return merged;
    }
    return DEFAULT_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [autoKey, setAutoKey] = useState(!perkId);

  // Tier assignments
  const [tierAssignments, setTierAssignments] = useState<Set<string>>(() => {
    if (!initialPerk) return new Set();
    const p = initialPerk as Record<string, unknown>;
    const assignments = p.tierAssignments as Array<{
      tier: { id: string };
      isEnabled: boolean;
    }> | undefined;
    if (!assignments) return new Set();
    return new Set(
      assignments.filter((a) => a.isEnabled).map((a) => a.tier.id)
    );
  });

  // Duplicate modal
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    // Create mode
    if (!perkId) {
      if (!form.key.trim()) {
        toast.error("Key is required");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/perks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to create perk");
          return;
        }
        const json = await res.json();
        toast.success("Perk created");
        router.push(`/admin/blocks/perks/${json.data.id}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode
    setSaving(true);
    try {
      const res = await fetch(`/api/perks/${perkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [form, perkId, router]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/perks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: duplicateName.trim(),
          key: `${form.key}_copy_${Date.now()}`,
          status: "DRAFT",
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const newPerk = await res.json();
      toast.success("Perk duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/blocks/perks/${newPerk.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, router]);

  const handleDelete = useCallback(async () => {
    if (!perkId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/perks/${perkId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Perk deleted");
      setDeleteOpen(false);
      router.push("/admin/blocks/perks");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [perkId, router]);

  const toggleTierAssignment = useCallback(
    async (tierId: string, enabled: boolean) => {
      const newSet = new Set(tierAssignments);
      if (enabled) {
        newSet.add(tierId);
      } else {
        newSet.delete(tierId);
      }
      setTierAssignments(newSet);

      if (!perkId) return;

      try {
        // Save tier assignment via the perks API
        const res = await fetch(`/api/perks/${perkId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierAssignments: Array.from(newSet).map((id) => ({
              subscriptionTierId: id,
              isEnabled: true,
            })),
          }),
        });
        if (!res.ok) toast.error("Failed to save tier assignment");
      } catch {
        toast.error("Failed to save tier assignment");
      }
    },
    [tierAssignments, perkId]
  );

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/blocks/perks"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Perks
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {form.name || "New Perk"}
          </span>
          <div className="ml-1">{statusBadge(form.status)}</div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Status select */}
          <Select
            value={form.status}
            onValueChange={(val) => {
              updateForm("status", val ?? "DRAFT");
              if (perkId) {
                fetch(`/api/perks/${perkId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: val }),
                }).then(() =>
                  toast.success(`Status changed to ${val?.toLowerCase()}`)
                );
              }
            }}
          >
            <SelectTrigger className="w-[130px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Save button */}
          <Button
            size="sm"
            className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving
              </>
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Saved
              </>
            ) : perkId ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>

          {/* Actions menu */}
          {perkId && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateName(`${form.name} (Copy)`);
                    setDuplicateOpen(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl space-y-8">
          {/* Overview Section */}
          <section className="space-y-5">
            <h2 className="text-sm font-semibold">Overview</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="perk-name">Name</Label>
                <Input
                  id="perk-name"
                  value={form.name}
                  onChange={(e) => {
                    updateForm("name", e.target.value);
                    if (autoKey) updateForm("key", toSlug(e.target.value));
                  }}
                  onBlur={perkId ? handleSave : undefined}
                  placeholder="Free Shipping"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="perk-key">Key (slug)</Label>
                <Input
                  id="perk-key"
                  value={form.key}
                  onChange={(e) => {
                    setAutoKey(false);
                    updateForm("key", e.target.value);
                  }}
                  onBlur={perkId ? handleSave : undefined}
                  placeholder="free_shipping"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perk-description">Description</Label>
              <Textarea
                id="perk-description"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                onBlur={perkId ? handleSave : undefined}
                placeholder="Short public-facing description..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perk-long-desc">Detailed Description</Label>
              <Textarea
                id="perk-long-desc"
                value={form.longDescription}
                onChange={(e) => updateForm("longDescription", e.target.value)}
                onBlur={perkId ? handleSave : undefined}
                placeholder="Detailed notes for admin reference..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="perk-icon">Icon</Label>
                <Input
                  id="perk-icon"
                  value={form.icon}
                  onChange={(e) => updateForm("icon", e.target.value)}
                  onBlur={perkId ? handleSave : undefined}
                  placeholder="gift"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="perk-sort">Sort Order</Label>
                <Input
                  id="perk-sort"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => updateForm("sortOrder", e.target.value)}
                  onBlur={perkId ? handleSave : undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => {
                    updateForm("status", val);
                    if (perkId) handleSave();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perk-tags">Tags (comma-separated)</Label>
              <Input
                id="perk-tags"
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                onBlur={perkId ? handleSave : undefined}
                placeholder="shipping, premium, exclusive"
              />
            </div>
          </section>

          {/* Sub-Config Section */}
          <section className="space-y-5 border-t pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Sub-Configuration</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-muted-foreground">Enable</span>
                <Switch
                  checked={form.hasSubConfig}
                  onCheckedChange={(val) => {
                    updateForm("hasSubConfig", val);
                    if (perkId) {
                      // Delay to let state update
                      setTimeout(() => handleSave(), 0);
                    }
                  }}
                />
              </label>
            </div>

            {form.hasSubConfig && (
              <div className="space-y-4 pl-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="perk-sub-label">Config Label</Label>
                    <Input
                      id="perk-sub-label"
                      value={form.subConfigLabel}
                      onChange={(e) => updateForm("subConfigLabel", e.target.value)}
                      onBlur={perkId ? handleSave : undefined}
                      placeholder='e.g. "Amount ($)", "Tier Level"'
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Config Type</Label>
                    <Select
                      value={form.subConfigType}
                      onValueChange={(val) => {
                        updateForm("subConfigType", val);
                        if (perkId) handleSave();
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.subConfigType === "select" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="perk-sub-options">
                      Options (comma-separated)
                    </Label>
                    <Input
                      id="perk-sub-options"
                      value={form.subConfigOptions}
                      onChange={(e) => updateForm("subConfigOptions", e.target.value)}
                      onBlur={perkId ? handleSave : undefined}
                      placeholder="standard, priority, vip"
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Tier Assignments Section */}
          {perkId && allTiers && (
            <section className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Gem className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Tier Assignments</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tierAssignments.size} of {allTiers.length} tiers
                </span>
              </div>

              <div className="space-y-2">
                {allTiers.map((tier) => {
                  const isEnabled = tierAssignments.has(tier.id);
                  return (
                    <div
                      key={tier.id}
                      className="rounded-lg border bg-card px-4 py-3"
                    >
                      <label className="flex items-center justify-between gap-4 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal"
                          >
                            <Gem className="h-3 w-3 mr-1" />
                            {tier.name}
                          </Badge>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(val) =>
                            toggleTierAssignment(tier.id, val)
                          }
                        />
                      </label>
                    </div>
                  );
                })}

                {allTiers.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No subscription tiers configured yet.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Perk
            </DialogTitle>
            <DialogDescription>
              Create a copy of this perk with a new name. All configuration will
              be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Perk Name</label>
            <Input
              placeholder="Perk name..."
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateOpen(false)}
              disabled={duplicating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete Perk
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{form.name}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Default form for new perks ─────────────────────────────────────

const DEFAULT_FORM: PerkFormState = {
  name: "",
  key: "",
  description: "",
  longDescription: "",
  icon: "gift",
  status: "DRAFT",
  sortOrder: "0",
  tags: "",
  hasSubConfig: false,
  subConfigLabel: "",
  subConfigType: "number",
  subConfigOptions: "",
};
