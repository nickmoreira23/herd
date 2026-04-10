"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, ChevronDown, Users, Building2, Trash2, Pencil } from "lucide-react";
import { DepartmentForm } from "./department-form";
import { toast } from "sonner";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  color: string | null;
  icon: string | null;
  head: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null } | null;
  parent: { id: string; name: string; slug: string } | null;
  children: { id: string; name: string }[];
  _count: { members: number };
}

interface ProfileOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DepartmentTreeProps {
  initialDepartments: Department[];
  profiles: ProfileOption[];
}

export function DepartmentTree({ initialDepartments, profiles }: DepartmentTreeProps) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Auto-expand root departments
    return new Set(departments.filter((d) => !d.parentId).map((d) => d.id));
  });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/departments");
    const json = await res.json();
    if (json.data) setDepartments(json.data);
  }, []);

  // Build tree structure
  const tree = useMemo(() => {
    interface TreeNode extends Department {
      childNodes: TreeNode[];
    }
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    for (const d of departments) {
      map.set(d.id, { ...d, childNodes: [] });
    }
    for (const d of departments) {
      const node = map.get(d.id)!;
      if (d.parentId && map.has(d.parentId)) {
        map.get(d.parentId)!.childNodes.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [departments]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete "${dept.name}"? Sub-departments will become top-level.`)) return;
    const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Department deleted");
      await refresh();
    } else {
      toast.error("Failed to delete");
    }
  };

  const openCreate = () => {
    setEditingDept(null);
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setModalOpen(true);
  };

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name, slug: d.slug }));

  function renderNode(node: Department & { childNodes: (Department & { childNodes: unknown[] })[] }, depth: number) {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.childNodes.length > 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/collapse toggle */}
          <button
            onClick={() => toggleExpand(node.id)}
            className="w-5 h-5 flex items-center justify-center shrink-0"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {/* Color dot */}
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: node.color || "#71717a" }}
          />

          {/* Name + link */}
          <Link
            href={`/admin/organization/departments/${node.id}`}
            className="text-sm font-medium hover:underline flex-1 min-w-0 truncate"
          >
            {node.name}
          </Link>

          {/* Head badge */}
          {node.head && (
            <Badge variant="outline" className="text-xs px-1 py-1 shrink-0">
              {node.head.firstName} {node.head.lastName}
            </Badge>
          )}

          {/* Member count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Users className="h-3 w-3" />
            {node._count.members}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => openEdit(node)}
              className="p-1 rounded hover:bg-muted"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="p-1 rounded hover:bg-muted"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Children */}
        {isExpanded &&
          hasChildren &&
          node.childNodes.map((child) =>
            renderNode(child as typeof node, depth + 1)
          )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organizational structure — divisions, departments, and teams.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-3 w-3" />
          Add Department
        </Button>
      </div>

      {/* Department tree */}
      <div className="rounded-xl ring-1 ring-foreground/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 text-xs text-muted-foreground font-medium">
          <Building2 className="h-3.5 w-3.5" />
          <span className="flex-1">Department</span>
          <span className="w-32 text-right">Head</span>
          <span className="w-16 text-right">Members</span>
          <span className="w-16" />
        </div>
        <div className="divide-y divide-border">
          {tree.length > 0 ? (
            tree.map((node) => renderNode(node as Parameters<typeof renderNode>[0], 0))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No departments yet. Create your first department to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {modalOpen && (
        <DepartmentForm
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSaved={refresh}
          departments={deptOptions}
          profiles={profiles}
          editingDepartment={
            editingDept
              ? {
                  id: editingDept.id,
                  name: editingDept.name,
                  description: editingDept.description,
                  parentId: editingDept.parentId,
                  headId: editingDept.head?.id ?? null,
                  color: editingDept.color,
                }
              : null
          }
        />
      )}
    </div>
  );
}
