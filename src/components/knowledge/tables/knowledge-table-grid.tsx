"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeTableToolbar } from "./knowledge-table-toolbar";
import { KnowledgeFieldConfigModal } from "./knowledge-field-config-modal";
import {
  TextCellRenderer,
  TextCellEditor,
  NumberCellRenderer,
  NumberCellEditor,
  SelectCellRenderer,
  SelectCellEditor,
  CheckboxCellRenderer,
  DateCellRenderer,
  DateCellEditor,
  UrlCellRenderer,
  UrlCellEditor,
  LinkedRecordCellRenderer,
  MediaCellRenderer,
  MediaCellEditor,
  FIELD_TYPE_CONFIG,
} from "./cells";
import type { CellRendererProps, CellEditorProps } from "./cells";
import type {
  KnowledgeTableRow,
  KnowledgeTableFieldRow,
  KnowledgeTableRecordRow,
} from "./types";

const DEFAULT_COL_WIDTH = 180;
const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 600;

function getColWidth(field: KnowledgeTableFieldRow): number {
  const w = field.options?.columnWidth;
  return typeof w === "number" && w >= MIN_COL_WIDTH ? w : DEFAULT_COL_WIDTH;
}

// ─── Renderer registry ──────────────────────────────────────
const RENDERERS: Record<string, React.ComponentType<CellRendererProps>> = {
  text: TextCellRenderer,
  number: NumberCellRenderer,
  select: SelectCellRenderer,
  checkbox: CheckboxCellRenderer,
  date: DateCellRenderer,
  url: UrlCellRenderer,
  linkedRecord: LinkedRecordCellRenderer,
  media: MediaCellRenderer,
};

const EDITORS: Record<string, React.ComponentType<CellEditorProps>> = {
  text: TextCellEditor,
  number: NumberCellEditor,
  select: SelectCellEditor,
  date: DateCellEditor,
  url: UrlCellEditor,
  media: MediaCellEditor,
};

// ─── Column Resize Handle ───────────────────────────────────
function ResizeHandle({
  onResize,
}: {
  onResize: (delta: number) => void;
}) {
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      isDraggingRef.current = true;

      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);

      const handleMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const delta = ev.clientX - startXRef.current;
        startXRef.current = ev.clientX;
        onResize(delta);
      };

      const handleUp = () => {
        isDraggingRef.current = false;
        el.removeEventListener("pointermove", handleMove);
        el.removeEventListener("pointerup", handleUp);
      };

      el.addEventListener("pointermove", handleMove);
      el.addEventListener("pointerup", handleUp);
    },
    [onResize]
  );

  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-20 group/resize hover:bg-primary/30 active:bg-primary/50"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute right-0 top-0 bottom-0 w-px bg-border group-hover/resize:bg-primary group-active/resize:bg-primary" />
    </div>
  );
}

// ─── Sortable Column Header ──────────────────────────────────
function SortableColumnHeader({
  field,
  width,
  onResize,
}: {
  field: KnowledgeTableFieldRow;
  width: number;
  onResize: (fieldId: string, delta: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width,
    minWidth: width,
    maxWidth: width,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative px-3 py-2 text-left text-xs font-medium text-muted-foreground border-r bg-muted/50 flex-shrink-0"
    >
      <div className="flex items-center gap-1 overflow-hidden">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 -ml-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
        <span className="truncate" title={field.name}>
          {field.name}
        </span>
        {field.isPrimary && (
          <span className="text-[9px] text-emerald-500 font-bold shrink-0">
            PK
          </span>
        )}
      </div>
      <ResizeHandle onResize={(delta) => onResize(field.id, delta)} />
    </div>
  );
}

// ─── Cell with text value for tooltip ────────────────────────
function getCellTextValue(
  value: unknown,
  field: KnowledgeTableFieldRow
): string {
  if (value == null || value === "") return "";
  if (typeof value === "object") {
    if ("filename" in (value as Record<string, unknown>))
      return (value as { filename: string }).filename;
    return JSON.stringify(value);
  }
  return String(value);
}

// ─── Sortable Row ────────────────────────────────────────────
function SortableRow({
  record,
  idx,
  fields,
  columnWidths,
  editingCell,
  onCellClick,
  renderCell,
  onDelete,
}: {
  record: KnowledgeTableRecordRow;
  idx: number;
  fields: KnowledgeTableFieldRow[];
  columnWidths: Record<string, number>;
  editingCell: { recordId: string; fieldId: string } | null;
  onCellClick: (recordId: string, field: KnowledgeTableFieldRow) => void;
  renderCell: (
    record: KnowledgeTableRecordRow,
    field: KnowledgeTableFieldRow
  ) => React.ReactNode;
  onDelete: (recordId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex border-b hover:bg-accent/30 transition-colors group"
    >
      {/* Row number + drag handle */}
      <div className="w-14 flex-shrink-0 px-1 py-1.5 text-[10px] text-muted-foreground text-center border-r tabular-nums">
        <div className="flex items-center justify-center gap-0.5">
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <span>{idx + 1}</span>
        </div>
      </div>
      {fields.map((field) => {
        const isEditing =
          editingCell?.recordId === record.id &&
          editingCell?.fieldId === field.id;
        const w = columnWidths[field.id] ?? DEFAULT_COL_WIDTH;
        const textVal = getCellTextValue(record.data?.[field.id], field);
        return (
          <div
            key={field.id}
            style={{ width: w, minWidth: w, maxWidth: w }}
            className={`px-2 py-1.5 border-r relative cursor-default flex-shrink-0 overflow-hidden ${
              isEditing
                ? "ring-2 ring-primary ring-inset bg-background"
                : "hover:bg-accent/20"
            } ${field.isPrimary ? "font-medium" : ""}`}
            onClick={() => onCellClick(record.id, field)}
            title={textVal || undefined}
          >
            <div className="truncate">{renderCell(record, field)}</div>
          </div>
        );
      })}
      {/* Row actions */}
      <div className="w-10 flex-shrink-0 px-1 py-1 border-r text-center flex items-center justify-center">
        <button
          className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-xs"
          onClick={() => onDelete(record.id)}
          title="Delete record"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

// ─── Main Grid ───────────────────────────────────────────────
interface KnowledgeTableGridProps {
  table: KnowledgeTableRow;
  fields: KnowledgeTableFieldRow[];
  initialRecords: KnowledgeTableRecordRow[];
  totalRecords: number;
  onFieldsChange: () => void;
}

export function KnowledgeTableGrid({
  table,
  fields,
  initialRecords,
  totalRecords: initialTotal,
  onFieldsChange,
}: KnowledgeTableGridProps) {
  const [localFields, setLocalFields] =
    useState<KnowledgeTableFieldRow[]>(fields);
  const [records, setRecords] =
    useState<KnowledgeTableRecordRow[]>(initialRecords);
  const [totalRecords, setTotalRecords] = useState(initialTotal);
  const [editingCell, setEditingCell] = useState<{
    recordId: string;
    fieldId: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Column widths — derived from field options, overridden locally during resize
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      const widths: Record<string, number> = {};
      for (const f of fields) {
        widths[f.id] = getColWidth(f);
      }
      return widths;
    }
  );

  // Sync fields from parent when they change
  const prevFieldsRef = useRef(fields);
  if (fields !== prevFieldsRef.current) {
    prevFieldsRef.current = fields;
    setLocalFields(fields);
    // Update widths for new fields
    setColumnWidths((prev) => {
      const next = { ...prev };
      for (const f of fields) {
        if (!(f.id in next)) {
          next[f.id] = getColWidth(f);
        }
      }
      return next;
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredRecords = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((record) => {
      const data = record.data || {};
      return Object.values(data).some(
        (v) => v != null && String(v).toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const refreshRecords = useCallback(async () => {
    const res = await fetch(
      `/api/knowledge/tables/${table.id}/records?limit=100`
    );
    const json = await res.json();
    if (json.data) {
      setRecords(json.data.records);
      setTotalRecords(json.data.total);
    }
  }, [table.id]);

  const addRecord = useCallback(async () => {
    const res = await fetch(`/api/knowledge/tables/${table.id}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: {} }),
    });
    if (res.ok) {
      await refreshRecords();
    } else {
      toast.error("Failed to add record");
    }
  }, [table.id, refreshRecords]);

  const deleteRecord = useCallback(
    async (recordId: string) => {
      const res = await fetch(
        `/api/knowledge/tables/${table.id}/records/${recordId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
        setTotalRecords((prev) => prev - 1);
        toast.success("Record deleted");
      }
    },
    [table.id]
  );

  const updateCell = useCallback(
    (recordId: string, fieldId: string, value: unknown) => {
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id !== recordId) return r;
          return { ...r, data: { ...r.data, [fieldId]: value } };
        })
      );

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        const res = await fetch(
          `/api/knowledge/tables/${table.id}/records/${recordId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: { [fieldId]: value } }),
          }
        );
        if (!res.ok) {
          toast.error("Failed to save");
          await refreshRecords();
        }
      }, 500);
    },
    [table.id, refreshRecords]
  );

  const handleCellClick = useCallback(
    (recordId: string, field: KnowledgeTableFieldRow) => {
      const config = FIELD_TYPE_CONFIG[field.type];
      if (!config?.editable) return;

      if (field.type === "checkbox") {
        const record = records.find((r) => r.id === recordId);
        const currentValue = record?.data?.[field.id];
        updateCell(recordId, field.id, !currentValue);
        return;
      }

      setEditingCell({ recordId, fieldId: field.id });
    },
    [records, updateCell]
  );

  const handleCommit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  // ─── Column resize ──────────────────────────────────────────
  const handleColumnResize = useCallback(
    (fieldId: string, delta: number) => {
      setColumnWidths((prev) => {
        const current = prev[fieldId] ?? DEFAULT_COL_WIDTH;
        const next = Math.max(
          MIN_COL_WIDTH,
          Math.min(MAX_COL_WIDTH, current + delta)
        );
        return { ...prev, [fieldId]: next };
      });

      // Debounced save to API
      if (resizeSaveRef.current) clearTimeout(resizeSaveRef.current);
      resizeSaveRef.current = setTimeout(async () => {
        // Read latest width from state
        setColumnWidths((latestWidths) => {
          const width = latestWidths[fieldId];
          if (width) {
            // Find current field options
            const field = localFields.find((f) => f.id === fieldId);
            const existingOptions = field?.options || {};
            fetch(
              `/api/knowledge/tables/${table.id}/fields/${fieldId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  options: { ...existingOptions, columnWidth: width },
                }),
              }
            ).catch(() => {});
          }
          return latestWidths;
        });
      }, 500);
    },
    [table.id, localFields]
  );

  // ─── Column reorder ─────────────────────────────────────────
  const handleColumnDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localFields.findIndex((f) => f.id === active.id);
      const newIndex = localFields.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(localFields, oldIndex, newIndex);
      setLocalFields(reordered);

      try {
        const res = await fetch(
          `/api/knowledge/tables/${table.id}/fields/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fieldIds: reordered.map((f) => f.id),
            }),
          }
        );
        if (res.ok) {
          onFieldsChange();
        } else {
          toast.error("Failed to reorder columns");
          setLocalFields(fields);
        }
      } catch {
        toast.error("Failed to reorder columns");
        setLocalFields(fields);
      }
    },
    [localFields, fields, table.id, onFieldsChange]
  );

  // ─── Row reorder ────────────────────────────────────────────
  const handleRowDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = records.findIndex((r) => r.id === active.id);
      const newIndex = records.findIndex((r) => r.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(records, oldIndex, newIndex);
      setRecords(reordered);

      try {
        await fetch(
          `/api/knowledge/tables/${table.id}/records/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordIds: reordered.map((r) => r.id),
            }),
          }
        );
      } catch {
        toast.error("Failed to reorder rows");
        await refreshRecords();
      }
    },
    [records, table.id, refreshRecords]
  );

  function renderCell(
    record: KnowledgeTableRecordRow,
    field: KnowledgeTableFieldRow
  ) {
    const value = record.data?.[field.id];
    const config = FIELD_TYPE_CONFIG[field.type];
    const isEditing =
      editingCell?.recordId === record.id &&
      editingCell?.fieldId === field.id;

    if (isEditing && config?.editable) {
      const editorType = config.renderer;
      const Editor = EDITORS[editorType];
      if (Editor) {
        return (
          <Editor
            value={value}
            field={field}
            onChange={(newValue) =>
              updateCell(record.id, field.id, newValue)
            }
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      }
    }

    const rendererType = config?.renderer || "text";
    const Renderer = RENDERERS[rendererType] || TextCellRenderer;
    return <Renderer value={value} field={field} />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0">
      <KnowledgeTableToolbar
        search={search}
        onSearchChange={setSearch}
        recordCount={filteredRecords.length}
        totalRecords={totalRecords}
        onAddRecord={addRecord}
        onAddField={() => setShowFieldConfig(true)}
      />

      {/* Grid */}
      <div className="flex-1 overflow-auto border rounded-lg mt-2">
        <div className="min-w-max text-sm">
          {/* Header row */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleColumnDragEnd}
          >
            <div className="flex border-b sticky top-0 z-10 bg-muted/50">
              {/* Row number column */}
              <div className="w-14 flex-shrink-0 px-2 py-2 text-[10px] text-muted-foreground font-medium text-center border-r bg-muted/50">
                #
              </div>
              <SortableContext
                items={localFields.map((f) => f.id)}
                strategy={horizontalListSortingStrategy}
              >
                {localFields.map((field) => (
                  <SortableColumnHeader
                    key={field.id}
                    field={field}
                    width={columnWidths[field.id] ?? DEFAULT_COL_WIDTH}
                    onResize={handleColumnResize}
                  />
                ))}
              </SortableContext>
              {/* Actions column */}
              <div className="w-10 flex-shrink-0 border-r bg-muted/50" />
            </div>
          </DndContext>

          {/* Body rows */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRowDragEnd}
          >
            <SortableContext
              items={filteredRecords.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredRecords.map((record, idx) => (
                <SortableRow
                  key={record.id}
                  record={record}
                  idx={idx}
                  fields={localFields}
                  columnWidths={columnWidths}
                  editingCell={editingCell}
                  onCellClick={handleCellClick}
                  renderCell={renderCell}
                  onDelete={deleteRecord}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add row button */}
          <div className="px-3 py-2 border-b">
            <button
              onClick={addRecord}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span className="text-lg leading-none">+</span>
              New record
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 && records.length > 0 && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            No records match your search
          </div>
        )}
      </div>

      <KnowledgeFieldConfigModal
        open={showFieldConfig}
        onOpenChange={setShowFieldConfig}
        tableId={table.id}
        onComplete={() => {
          setShowFieldConfig(false);
          onFieldsChange();
        }}
      />
    </div>
  );
}
