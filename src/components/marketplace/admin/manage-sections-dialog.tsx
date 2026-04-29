"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SectionRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  iconKey: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionRow[];
  /** Triggered when the dialog persists changes — caller refetches. */
  onChange: () => void;
}

export function ManageSectionsDialog({
  open,
  onOpenChange,
  sections,
  onChange,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<SectionRow[]>(sections);
  const [saving, setSaving] = useState(false);

  // Whenever the dialog opens with fresh data, sync.
  useEffect(() => {
    if (open) setItems(sections);
  }, [open, sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace/sections/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: items.map((s, idx) => ({ id: s.id, sortOrder: idx })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error ?? "Failed to save order");
        return;
      }
      toast.success("Order saved");
      window.dispatchEvent(new Event("marketplace-sections-updated"));
      onChange();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(s: SectionRow) {
    if (
      !confirm(
        `Delete "${s.name}"? This cannot be undone and removes the section from Explore.`
      )
    )
      return;
    const res = await fetch(`/api/marketplace/sections/${s.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success(`"${s.name}" deleted`);
    setItems((prev) => prev.filter((x) => x.id !== s.id));
    window.dispatchEvent(new Event("marketplace-sections-updated"));
    onChange();
    // If the user is currently viewing the section that was just deleted,
    // bounce back to /admin/marketplace (which redirects to the first
    // remaining section or shows the empty state).
    if (pathname.includes(`/admin/marketplace/sections/${s.id}`)) {
      onOpenChange(false);
      router.push("/admin/marketplace");
    }
  }

  function editSection(s: SectionRow) {
    onOpenChange(false);
    router.push(`/admin/marketplace/sections/${s.id}/edit`);
  }

  function addSection() {
    onOpenChange(false);
    router.push("/admin/marketplace/sections/new");
  }

  const dirty =
    items.length === sections.length &&
    items.some((s, i) => s.id !== sections[i]?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage sections</DialogTitle>
          <DialogDescription>
            Drag to reorder, edit a section, or remove one entirely.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end -mt-2">
          <Button size="sm" variant="outline" onClick={addSection}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add section
          </Button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto -mx-6 px-6 space-y-1.5">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No sections yet.
            </p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((s) => (
                <SortableRow
                  key={s.id}
                  section={s}
                  onEdit={() => editSection(s)}
                  onDelete={() => deleteSection(s)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Close
          </Button>
          <Button onClick={saveOrder} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({
  section,
  onEdit,
  onDelete,
}: {
  section: SectionRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background px-2 py-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{section.name}</p>
          <Badge
            variant={section.status === "PUBLISHED" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {section.status.toLowerCase()}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate">
          /explore/{section.slug}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
