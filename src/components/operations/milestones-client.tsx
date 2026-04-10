"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────

interface MilestoneLevel {
  id: string;
  memberCount: number;
  label: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MilestonesClientProps {
  initialLevels: MilestoneLevel[];
}

// ─── Component ────────────────────────────────────────────────

export function MilestonesClient({ initialLevels }: MilestonesClientProps) {
  const [levels, setLevels] = useState<MilestoneLevel[]>(initialLevels);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MilestoneLevel | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add form state
  const [addLabel, setAddLabel] = useState("");
  const [addMemberCount, setAddMemberCount] = useState("");
  const [addSortOrder, setAddSortOrder] = useState("0");
  const [adding, setAdding] = useState(false);

  // Edit form state
  const [editLabel, setEditLabel] = useState("");
  const [editMemberCount, setEditMemberCount] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  // ─── Stats ──────────────────────────────────────────────────

  const totalMilestones = levels.length;
  const minCount = levels.length > 0 ? levels[0].memberCount : 0;
  const maxCount = levels.length > 0 ? levels[levels.length - 1].memberCount : 0;

  // ─── Refresh ────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/operation/milestones");
      if (!res.ok) return;
      const json = await res.json();
      setLevels(json.data);
    } catch {
      // silent
    }
  }, []);

  // ─── Add ────────────────────────────────────────────────────

  const handleAdd = useCallback(async () => {
    if (!addLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    const memberCount = parseInt(addMemberCount);
    if (isNaN(memberCount) || memberCount < 0) {
      toast.error("Member count must be a non-negative integer");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/operation/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: addLabel.trim(),
          memberCount,
          sortOrder: parseInt(addSortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to create milestone");
        return;
      }
      toast.success("Milestone created");
      setAddOpen(false);
      setAddLabel("");
      setAddMemberCount("");
      setAddSortOrder("0");
      await refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAdding(false);
    }
  }, [addLabel, addMemberCount, addSortOrder, refresh]);

  // ─── Edit ───────────────────────────────────────────────────

  const startEdit = useCallback((level: MilestoneLevel) => {
    setEditingId(level.id);
    setEditLabel(level.label);
    setEditMemberCount(String(level.memberCount));
    setEditSortOrder(String(level.sortOrder));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingId) return;
    if (!editLabel.trim()) {
      toast.error("Label is required");
      return;
    }
    const memberCount = parseInt(editMemberCount);
    if (isNaN(memberCount) || memberCount < 0) {
      toast.error("Member count must be a non-negative integer");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/operation/milestones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          label: editLabel.trim(),
          memberCount,
          sortOrder: parseInt(editSortOrder) || 0,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to update milestone");
        return;
      }
      toast.success("Milestone updated");
      setEditingId(null);
      await refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [editingId, editLabel, editMemberCount, editSortOrder, refresh]);

  // ─── Delete ─────────────────────────────────────────────────

  const confirmDelete = useCallback((level: MilestoneLevel) => {
    setDeleteTarget(level);
    setDeleteOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/operation/milestones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete milestone");
        return;
      }
      toast.success("Milestone deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      await refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refresh]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Milestones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define member count thresholds for expense scaling.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Milestone
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
          <p className="text-xs text-muted-foreground whitespace-nowrap">Total Milestones</p>
          <p className="text-lg font-bold tabular-nums">{totalMilestones}</p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
          <p className="text-xs text-muted-foreground whitespace-nowrap">Min Members</p>
          <p className="text-lg font-bold tabular-nums">
            {totalMilestones > 0 ? formatNumber(minCount) : "--"}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
          <p className="text-xs text-muted-foreground whitespace-nowrap">Max Members</p>
          <p className="text-lg font-bold tabular-nums">
            {totalMilestones > 0 ? formatNumber(maxCount) : "--"}
          </p>
        </div>
      </div>

      {/* Milestone Cards */}
      {levels.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No milestones configured yet. Add one to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {levels.map((level) => {
            const isEditing = editingId === level.id;

            if (isEditing) {
              return (
                <div
                  key={level.id}
                  className="rounded-lg border bg-card p-4 ring-2 ring-[#C5F135]/40"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-label-${level.id}`}>Label</Label>
                      <Input
                        id={`edit-label-${level.id}`}
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="e.g. Pre-Launch"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-count-${level.id}`}>
                        Member Count
                      </Label>
                      <Input
                        id={`edit-count-${level.id}`}
                        type="number"
                        min="0"
                        value={editMemberCount}
                        onChange={(e) => setEditMemberCount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-sort-${level.id}`}>
                        Sort Order
                      </Label>
                      <Input
                        id={`edit-sort-${level.id}`}
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Saving
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={level.id}
                className="rounded-lg border bg-card p-4 flex items-center justify-between group hover:border-muted-foreground/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono px-2 py-0.5"
                    >
                      {formatNumber(level.memberCount)} members
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-sm">{level.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-xs">
                    <ArrowUpDown className="h-3 w-3" />
                    {level.sortOrder}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(level)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-500 hover:text-red-500"
                    onClick={() => confirmDelete(level)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Milestone
            </DialogTitle>
            <DialogDescription>
              Create a new member count threshold for expense scaling.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-label">Label</Label>
              <Input
                id="add-label"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder='e.g. "Pre-Launch", "1k", "5k"'
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="add-member-count">Member Count</Label>
                <Input
                  id="add-member-count"
                  type="number"
                  min="0"
                  value={addMemberCount}
                  onChange={(e) => setAddMemberCount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-sort-order">Sort Order</Label>
                <Input
                  id="add-sort-order"
                  type="number"
                  value={addSortOrder}
                  onChange={(e) => setAddSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Creating
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete Milestone
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the{" "}
              <strong>{deleteTarget?.label}</strong> milestone (
              {deleteTarget ? formatNumber(deleteTarget.memberCount) : 0}{" "}
              members)? This action cannot be undone.
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
