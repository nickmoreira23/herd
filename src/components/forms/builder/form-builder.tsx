"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Eye,
  Rocket,
  XCircle,
  Link2,
  Plus,
  Settings,
  ListTree,
  BarChart3,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { FormBuilderSidebar } from "./form-builder-sidebar";
import { FormBuilderSection } from "./form-builder-section";
import { FormBuilderFieldConfig } from "./form-builder-field-config";
import { FormSettings } from "../form-settings";
import { FieldTypeIcon, FIELD_TYPE_CONFIG } from "./field-type-icon";
import type {
  FormDetail,
  FormRow,
  FormSectionRow,
  FormFieldRow,
} from "../types";
import type { FormFieldType } from "@/lib/validations/knowledge-form";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";

interface FormBuilderProps {
  initialForm: FormDetail;
}

const FORM_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
};

export function FormBuilder({ initialForm }: FormBuilderProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormDetail>(initialForm);
  const [sections, setSections] = useState(initialForm.sections);
  const [activeTab, setActiveTab] = useState("builder");
  const [editingField, setEditingField] =
    useState<FormFieldRow | null>(null);
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null);
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [defaultFieldType, setDefaultFieldType] =
    useState<FormFieldType | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"section" | "field" | null>(
    null
  );
  // Track the original section for cross-section field moves
  const originalSectionRef = useRef<string | null>(null);

  // Sync sections from form (after server refresh)
  useEffect(() => {
    setSections(form.sections);
  }, [form.sections]);

  // Sensors — distance constraint prevents accidental drags on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Section sortable IDs (prefixed to avoid collision with field IDs)
  const sectionSortableIds = useMemo(
    () => sections.map((s) => `section:${s.id}`),
    [sections]
  );

  const refreshForm = useCallback(async () => {
    const res = await fetch(`/api/forms/${form.id}`);
    const json = await res.json();
    if (json.data) setForm(json.data);
  }, [form.id]);

  // ─── DnD Handlers ────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "section") {
      setActiveId(active.id as string);
      setActiveType("section");
      originalSectionRef.current = null;
    } else if (data?.type === "field") {
      setActiveId(active.id as string);
      setActiveType("field");
      originalSectionRef.current = data.sectionId;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "field") return;

    const activeFieldId = active.id as string;
    const overData = over.data.current;

    // Determine which section the over target belongs to
    let targetSectionId: string | null = null;
    if (overData?.type === "field") {
      targetSectionId = overData.sectionId;
    } else if (overData?.type === "section-container") {
      targetSectionId = overData.sectionId;
    }
    if (!targetSectionId) return;

    // Find the field's current section in local state
    let currentSectionId: string | null = null;
    for (const s of sections) {
      if (s.fields.some((f) => f.id === activeFieldId)) {
        currentSectionId = s.id;
        break;
      }
    }
    if (!currentSectionId || currentSectionId === targetSectionId) return;

    // Move field from current section to target section
    setSections((prev) => {
      const sourceIdx = prev.findIndex((s) => s.id === currentSectionId);
      const targetIdx = prev.findIndex((s) => s.id === targetSectionId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const field = prev[sourceIdx].fields.find(
        (f) => f.id === activeFieldId
      );
      if (!field) return prev;

      const next = prev.map((s) => ({ ...s, fields: [...s.fields] }));

      // Remove from source
      next[sourceIdx].fields = next[sourceIdx].fields.filter(
        (f) => f.id !== activeFieldId
      );

      // Insert into target at the position of the over item, or at end
      const movedField = { ...field, sectionId: targetSectionId! };
      if (overData?.type === "field") {
        const overIdx = next[targetIdx].fields.findIndex(
          (f) => f.id === (over.id as string)
        );
        next[targetIdx].fields.splice(
          overIdx >= 0 ? overIdx : next[targetIdx].fields.length,
          0,
          movedField
        );
      } else {
        next[targetIdx].fields.push(movedField);
      }

      return next;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const dragType = activeType;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    // ─── Section reorder ─────────────────────────────────────────────
    if (dragType === "section") {
      const activeRealId = (active.id as string).replace("section:", "");
      const overRealId = (over.id as string).replace("section:", "");
      if (activeRealId === overRealId) return;

      const oldIndex = sections.findIndex((s) => s.id === activeRealId);
      const newIndex = sections.findIndex((s) => s.id === overRealId);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sections, oldIndex, newIndex);
      setSections(reordered);
      setForm((prev) => ({ ...prev, sections: reordered }));

      await fetch(`/api/forms/${form.id}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: reordered.map((s) => s.id) }),
      });
      await refreshForm();
      return;
    }

    // ─── Field reorder / cross-section move ──────────────────────────
    if (dragType === "field") {
      const activeFieldId = active.id as string;

      // Find which section the field is in now (after any onDragOver moves)
      const currentSection = sections.find((s) =>
        s.fields.some((f) => f.id === activeFieldId)
      );
      if (!currentSection) return;

      // If over target is a field in the same section, reorder
      if (
        over.data.current?.type === "field" &&
        activeFieldId !== (over.id as string)
      ) {
        const oldIndex = currentSection.fields.findIndex(
          (f) => f.id === activeFieldId
        );
        const newIndex = currentSection.fields.findIndex(
          (f) => f.id === (over.id as string)
        );
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedFields = arrayMove(
            currentSection.fields,
            oldIndex,
            newIndex
          );
          setSections((prev) =>
            prev.map((s) =>
              s.id === currentSection.id
                ? { ...s, fields: reorderedFields }
                : s
            )
          );
        }
      }

      // Determine if field moved to a different section
      const origSectionId = originalSectionRef.current;
      const crossSection = origSectionId && origSectionId !== currentSection.id;

      // Persist cross-section move
      if (crossSection) {
        await fetch(
          `/api/forms/${form.id}/fields/${activeFieldId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId: currentSection.id }),
          }
        );
      }

      // Persist field order in the target section
      const targetFields = sections.find((s) =>
        s.fields.some((f) => f.id === activeFieldId)
      );
      if (targetFields) {
        await fetch(`/api/forms/${form.id}/fields/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fieldIds: targetFields.fields.map((f) => f.id),
          }),
        });
      }

      // If cross-section, also persist the source section's new order
      if (crossSection) {
        const oldSection = sections.find((s) => s.id === origSectionId);
        if (oldSection && oldSection.fields.length > 0) {
          await fetch(`/api/forms/${form.id}/fields/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldIds: oldSection.fields.map((f) => f.id),
            }),
          });
        }
      }

      originalSectionRef.current = null;
      await refreshForm();
    }
  }

  // ─── Active item for DragOverlay ──────────────────────────────────

  const activeField = useMemo(() => {
    if (activeType !== "field" || !activeId) return null;
    for (const s of sections) {
      const f = s.fields.find((f) => f.id === activeId);
      if (f) return f;
    }
    return null;
  }, [activeType, activeId, sections]);

  const activeSection = useMemo(() => {
    if (activeType !== "section" || !activeId) return null;
    const realId = activeId.replace("section:", "");
    return sections.find((s) => s.id === realId) || null;
  }, [activeType, activeId, sections]);

  // ─── Section collapse ─────────────────────────────────────────────

  const toggleCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  // ─── Sections CRUD ────────────────────────────────────────────────

  const handleAddSection = useCallback(async () => {
    const sortOrder = form.sections.length;
    await fetch(`/api/forms/${form.id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Section ${sortOrder + 1}`, sortOrder }),
    });
    await refreshForm();
  }, [form.id, form.sections.length, refreshForm]);

  const handleUpdateSection = useCallback(
    async (
      sectionId: string,
      data: { title?: string; description?: string }
    ) => {
      await fetch(`/api/forms/${form.id}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refreshForm();
    },
    [form.id, refreshForm]
  );

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      await fetch(`/api/forms/${form.id}/sections/${sectionId}`, {
        method: "DELETE",
      });
      await refreshForm();
    },
    [form.id, refreshForm]
  );

  // ─── Fields CRUD ──────────────────────────────────────────────────

  const handleAddField = useCallback(
    (type: FormFieldType) => {
      const targetSection = form.sections[0];
      if (!targetSection) return;
      setEditingField(null);
      setAddToSectionId(targetSection.id);
      setDefaultFieldType(type);
      setShowFieldConfig(true);
    },
    [form.sections]
  );

  const handleAddFieldToSection = useCallback((sectionId: string) => {
    setEditingField(null);
    setAddToSectionId(sectionId);
    setDefaultFieldType(null);
    setShowFieldConfig(true);
  }, []);

  const handleEditField = useCallback((field: FormFieldRow) => {
    setEditingField(field);
    setAddToSectionId(field.sectionId);
    setDefaultFieldType(null);
    setShowFieldConfig(true);
  }, []);

  const handleDeleteField = useCallback(
    async (fieldId: string) => {
      await fetch(`/api/forms/${form.id}/fields/${fieldId}`, {
        method: "DELETE",
      });
      await refreshForm();
    },
    [form.id, refreshForm]
  );

  // ─── Publish / Close ──────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    const res = await fetch(`/api/forms/${form.id}/publish`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Form published! Share link is now active.");
      await refreshForm();
    } else {
      const json = await res.json().catch(() => null);
      toast.error(json?.error || "Failed to publish form");
    }
  }, [form.id, refreshForm]);

  const handleClose = useCallback(async () => {
    const res = await fetch(`/api/forms/${form.id}/close`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Form closed");
      await refreshForm();
    } else {
      toast.error("Failed to close form");
    }
  }, [form.id, refreshForm]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  }, [form.slug]);

  const handleFormUpdate = useCallback(
    (updated: FormRow) => {
      setForm({ ...form, ...updated });
    },
    [form]
  );

  const statusConfig =
    FORM_STATUS_CONFIG[form.formStatus] || FORM_STATUS_CONFIG.DRAFT;
  const totalFields = sections.reduce(
    (sum, s) => sum + s.fields.length,
    0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push("/admin/organization/knowledge/forms")
          }
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{form.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant="outline"
              className={`text-[10px] ${statusConfig.className}`}
            >
              {statusConfig.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {totalFields} field{totalFields !== 1 ? "s" : ""} &middot;{" "}
              {form.responseCount} response
              {form.responseCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {form.formStatus === "ACTIVE" && (
          <>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Link2 className="h-3 w-3 mr-1" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/f/${form.slug}`, "_blank")}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleClose}>
              <XCircle className="h-3 w-3 mr-1" />
              Close Form
            </Button>
          </>
        )}

        {form.formStatus === "DRAFT" && (
          <Button size="sm" onClick={handlePublish}>
            <Rocket className="h-3 w-3 mr-1" />
            Publish
          </Button>
        )}

        {form.formStatus === "ACTIVE" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/admin/organization/knowledge/forms/${form.id}/responses`
              )
            }
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Responses
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — field types */}
        <div className="w-48 border-r p-3 overflow-y-auto shrink-0 hidden lg:block">
          <FormBuilderSidebar onAddField={handleAddField} />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => v && setActiveTab(v)}
            className="h-full flex flex-col"
          >
            <div className="border-b px-4">
              <TabsList>
                <TabsTrigger value="builder">
                  <ListTree className="h-3 w-3 mr-1" />
                  Builder
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="builder"
              className="flex-1 p-4 space-y-4 overflow-y-auto"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sectionSortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {sections.map((section) => (
                    <FormBuilderSection
                      key={section.id}
                      section={section}
                      isOnly={sections.length === 1}
                      onEditField={handleEditField}
                      onDeleteField={handleDeleteField}
                      onAddFieldToSection={handleAddFieldToSection}
                      onUpdateSection={handleUpdateSection}
                      onDeleteSection={handleDeleteSection}
                      collapsed={collapsedSections.has(section.id)}
                      onToggleCollapse={() => toggleCollapse(section.id)}
                    />
                  ))}
                </SortableContext>

                {/* Drag overlay — renders the floating preview that follows the cursor */}
                <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                  {activeField && (
                    <FieldDragPreview field={activeField} />
                  )}
                  {activeSection && (
                    <SectionDragPreview section={activeSection} />
                  )}
                </DragOverlay>
              </DndContext>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddSection}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Section
              </Button>
            </TabsContent>

            <TabsContent
              value="settings"
              className="flex-1 p-4 overflow-y-auto"
            >
              <div className="max-w-lg">
                <FormSettings
                  form={form}
                  onUpdate={handleFormUpdate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Field config dialog */}
      <FormBuilderFieldConfig
        open={showFieldConfig}
        onOpenChange={setShowFieldConfig}
        field={editingField}
        formId={form.id}
        sectionId={addToSectionId || form.sections[0]?.id || ""}
        onSave={refreshForm}
        defaultType={defaultFieldType}
      />
    </div>
  );
}

// ─── Drag Overlay Previews ─────────────────────────────────────────────

function FieldDragPreview({ field }: { field: FormFieldRow }) {
  const typeConfig = FIELD_TYPE_CONFIG[field.type as FormFieldType];

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-xl ring-2 ring-primary/30 border-primary/30 cursor-grabbing">
      <div className="text-muted-foreground/40">
        <GripVertical className="h-4 w-4" />
      </div>
      <FieldTypeIcon
        type={field.type as FormFieldType}
        className="h-4 w-4 text-muted-foreground shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{field.label}</span>
          {field.isRequired && (
            <span className="text-xs text-red-500 font-medium">*</span>
          )}
        </div>
      </div>
      <Badge variant="outline" className="text-[10px] shrink-0">
        {typeConfig?.label ?? field.type}
      </Badge>
    </div>
  );
}

function SectionDragPreview({
  section,
}: {
  section: FormSectionRow;
}) {
  return (
    <div className="rounded-xl border bg-card/80 shadow-xl ring-2 ring-primary/30 border-primary/30 cursor-grabbing">
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        <span className="text-sm font-medium">
          {section.title || "Untitled Section"}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {section.fields.length} field
          {section.fields.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
