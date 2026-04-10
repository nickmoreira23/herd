"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CommunityBenefit } from "@/types";
import { COMMUNITY_BENEFIT_STATUSES, COMMUNITY_PLATFORMS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// ─── Exported types ─────────────────────────────────────────────────

export interface CommunityFormState {
  name: string;
  key: string;
  description: string;
  longDescription: string;
  icon: string;
  platform: string;
  accessUrl: string;
  status: string;
  sortOrder: string;
  tags: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function benefitToForm(benefit: CommunityBenefit): CommunityFormState {
  const b = benefit as Record<string, unknown>;
  return {
    name: benefit.name,
    key: benefit.key,
    description: benefit.description || "",
    longDescription: (b.longDescription as string) || "",
    icon: benefit.icon,
    platform: benefit.platform || "",
    accessUrl: (b.accessUrl as string) || "",
    status: benefit.status,
    sortOrder: String(benefit.sortOrder),
    tags: benefit.tags.join(", "),
  };
}

function formToPayload(form: CommunityFormState) {
  return {
    name: form.name,
    key: form.key,
    description: form.description || undefined,
    longDescription: form.longDescription || undefined,
    icon: form.icon || "users",
    platform: form.platform || undefined,
    accessUrl: form.accessUrl || undefined,
    status: form.status,
    sortOrder: parseInt(form.sortOrder) || 0,
    tags: form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// ─── Props ──────────────────────────────────────────────────────────

interface TierAssignment {
  id: string;
  subscriptionTierId: string;
  isEnabled: boolean;
  tier: { id: string; name: string };
}

interface CommunityDetailClientProps {
  benefitId?: string;
  initialBenefit?: CommunityBenefit & { tierAssignments: TierAssignment[] };
  allTiers?: { id: string; name: string }[];
  prefill?: Partial<CommunityFormState>;
}

// ─── Component ──────────────────────────────────────────────────────

export function CommunityDetailClient({
  benefitId,
  initialBenefit,
  allTiers,
  prefill,
}: CommunityDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<CommunityFormState>(() => {
    if (initialBenefit) return benefitToForm(initialBenefit);
    if (prefill) {
      const merged = { ...DEFAULT_FORM, ...prefill };
      if (merged.name && !prefill.key) merged.key = slugify(merged.name);
      return merged;
    }
    return DEFAULT_FORM;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Tier assignments state
  const [tierStates, setTierStates] = useState<Record<string, boolean>>(() => {
    if (!initialBenefit?.tierAssignments) return {};
    const map: Record<string, boolean> = {};
    for (const ta of initialBenefit.tierAssignments) {
      map[ta.tier.id] = ta.isEnabled;
    }
    return map;
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
    if (!benefitId) {
      if (!form.key.trim()) {
        toast.error("Key is required");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/community", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to create benefit");
          return;
        }
        const json = await res.json();
        toast.success("Benefit created");
        router.push(`/admin/community/${json.data.id}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode
    setSaving(true);
    try {
      const res = await fetch(`/api/community/${benefitId}`, {
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
  }, [form, benefitId, router]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/community", {
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
      const newBenefit = await res.json();
      toast.success("Benefit duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/community/${newBenefit.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, router]);

  const handleDelete = useCallback(async () => {
    if (!benefitId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/${benefitId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Benefit deleted");
      setDeleteOpen(false);
      router.push("/admin/community");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [benefitId, router]);

  const handleTierToggle = useCallback(
    async (tierId: string, enabled: boolean) => {
      setTierStates((prev) => ({ ...prev, [tierId]: enabled }));
      if (!benefitId) return;
      try {
        await fetch(`/api/community/${benefitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierAssignments: [{ subscriptionTierId: tierId, isEnabled: enabled }],
          }),
        });
        toast.success(enabled ? "Tier enabled" : "Tier disabled");
      } catch {
        toast.error("Failed to update tier");
        setTierStates((prev) => ({ ...prev, [tierId]: !enabled }));
      }
    },
    [benefitId]
  );

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/community"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Community Benefits
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {form.name || "New Benefit"}
          </span>
          <div className="ml-1">{statusBadge(form.status)}</div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Status select */}
          <Select
            value={form.status}
            onValueChange={(val) => {
              updateForm("status", val ?? "DRAFT");
              if (benefitId) {
                fetch(`/api/community/${benefitId}`, {
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
              {COMMUNITY_BENEFIT_STATUSES.map((s) => (
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
            ) : benefitId ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>

          {/* Actions menu */}
          {benefitId && (
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
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Overview Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={form.name}
                onChange={(e) => {
                  updateForm("name", e.target.value);
                  if (!benefitId) {
                    updateForm("key", slugify(e.target.value));
                  }
                }}
                onBlur={() => benefitId && handleSave()}
                placeholder="Benefit name"
                className="text-sm"
              />
            </div>

            {/* Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Key</label>
              <Input
                value={form.key}
                onChange={(e) => updateForm("key", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="unique_key"
                className="text-sm font-mono"
                disabled={!!benefitId}
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="Short description"
                className="text-sm"
              />
            </div>

            {/* Long Description */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Long Description</label>
              <Textarea
                value={form.longDescription}
                onChange={(e) => updateForm("longDescription", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="Detailed description..."
                className="text-sm min-h-[80px]"
              />
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Icon</label>
              <Input
                value={form.icon}
                onChange={(e) => updateForm("icon", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="users"
                className="text-sm"
              />
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <Select
                value={form.platform || "none"}
                onValueChange={(val) => {
                  updateForm("platform", val === "none" ? "" : val);
                  if (benefitId) handleSave();
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {COMMUNITY_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Access URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Access URL</label>
              <Input
                value={form.accessUrl}
                onChange={(e) => updateForm("accessUrl", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="https://..."
                className="text-sm"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={form.status}
                onValueChange={(val) => {
                  updateForm("status", val ?? "DRAFT");
                  if (benefitId) handleSave();
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNITY_BENEFIT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => updateForm("sortOrder", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="0"
                className="text-sm"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <Input
                value={form.tags}
                onChange={(e) => updateForm("tags", e.target.value)}
                onBlur={() => benefitId && handleSave()}
                placeholder="tag1, tag2, tag3"
                className="text-sm"
              />
            </div>
          </div>
        </section>

        {/* Tier Assignments Section */}
        {allTiers && allTiers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tier Assignments
            </h2>
            <div className="rounded-lg border divide-y">
              {allTiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm font-medium">{tier.name}</span>
                  <Switch
                    checked={tierStates[tier.id] ?? false}
                    onCheckedChange={(checked) => handleTierToggle(tier.id, checked)}
                    disabled={!benefitId}
                  />
                </div>
              ))}
            </div>
            {!benefitId && (
              <p className="text-xs text-muted-foreground">
                Save the benefit first to manage tier assignments.
              </p>
            )}
          </section>
        )}
      </div>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Benefit
            </DialogTitle>
            <DialogDescription>
              Create a copy of this benefit with a new name. All configuration will
              be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Benefit Name</label>
            <Input
              placeholder="Benefit name..."
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
              Delete Benefit
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

// ─── Default form for new benefits ─────────────────────────────────

const DEFAULT_FORM: CommunityFormState = {
  name: "",
  key: "",
  description: "",
  longDescription: "",
  icon: "users",
  platform: "",
  accessUrl: "",
  status: "DRAFT",
  sortOrder: "0",
  tags: "",
};
