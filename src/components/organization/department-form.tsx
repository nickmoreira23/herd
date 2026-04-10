"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface DepartmentOption {
  id: string;
  name: string;
  slug: string;
}

interface ProfileOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  departments: DepartmentOption[];
  profiles: ProfileOption[];
  editingDepartment?: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    headId: string | null;
    color: string | null;
  } | null;
}

const COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Green", value: "#10b981" },
  { label: "Pink", value: "#ec4899" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
];

export function DepartmentForm({
  open,
  onOpenChange,
  onSaved,
  departments,
  profiles,
  editingDepartment,
}: DepartmentFormProps) {
  const [name, setName] = useState(editingDepartment?.name ?? "");
  const [description, setDescription] = useState(editingDepartment?.description ?? "");
  const [parentId, setParentId] = useState(editingDepartment?.parentId ?? "");
  const [headId, setHeadId] = useState(editingDepartment?.headId ?? "");
  const [color, setColor] = useState(editingDepartment?.color ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editingDepartment
        ? `/api/departments/${editingDepartment.id}`
        : "/api/departments";
      const method = editingDepartment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          parentId: parentId || null,
          headId: headId || null,
          color: color || null,
        }),
      });

      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }

      toast.success(editingDepartment ? "Department updated" : "Department created");
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingDepartment ? "Edit Department" : "Create Department"}
          </DialogTitle>
          <DialogDescription>
            {editingDepartment
              ? "Update this department's details."
              : "Add a new department to your organization."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this department do?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parent Department</Label>
              <Select
                value={parentId || "NONE"}
                onValueChange={(val) => setParentId(val === "NONE" ? "" : val ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (top-level)</SelectItem>
                  {departments
                    .filter((d) => d.id !== editingDepartment?.id)
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department Head</Label>
              <Select
                value={headId || "NONE"}
                onValueChange={(val) => setHeadId(val === "NONE" ? "" : val ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No head assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No head assigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value === color ? "" : c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "white" : "transparent",
                    boxShadow: color === c.value ? `0 0 0 2px ${c.value}` : "none",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingDepartment ? "Save Changes" : "Create Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
