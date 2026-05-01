import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Percent,
  List,
  ListChecks,
  CheckSquare,
  Calendar,
  Link2,
  Mail,
  ArrowUpRight,
  ImageIcon,
  Paperclip,
  Clock,
  History,
  ListOrdered,
  Sigma,
  TrendingUp,
  Search,
  Hash as HashCount,
  type LucideIcon,
} from "lucide-react";
import type { MessageKey } from "@/lib/i18n/t";
import type { TableFieldRow } from "../types";

export interface CellRendererProps {
  value: unknown;
  field: TableFieldRow;
}

export interface CellEditorProps extends CellRendererProps {
  onChange: (value: unknown) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export { TextCellRenderer, TextCellEditor } from "./text-cell";
export { NumberCellRenderer, NumberCellEditor } from "./number-cell";
export { SelectCellRenderer, SelectCellEditor } from "./select-cell";
export { CheckboxCellRenderer } from "./checkbox-cell";
export { DateCellRenderer, DateCellEditor } from "./date-cell";
export { UrlCellRenderer, UrlCellEditor } from "./url-cell";
export { LinkedRecordCellRenderer } from "./linked-record-cell";
export { MediaCellRenderer, MediaCellEditor } from "./media-cell";

/**
 * Cell renderer key — picked by the dispatcher in table-grid to choose
 * which renderer/editor pair to use for a given field type.
 */
export type CellRendererKey =
  | "text"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "url"
  | "linkedRecord"
  | "media";

export type TableFieldTypeValue =
  | "singleLineText"
  | "multilineText"
  | "number"
  | "currency"
  | "percent"
  | "singleSelect"
  | "multiSelect"
  | "checkbox"
  | "date"
  | "url"
  | "email"
  | "linkedRecord"
  | "media"
  | "attachment"
  | "createdTime"
  | "lastModifiedTime"
  | "autoNumber"
  | "formula"
  | "rollup"
  | "lookup"
  | "count";

export interface TableFieldTypeMeta {
  value: TableFieldTypeValue;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  icon: LucideIcon;
  cellRenderer: CellRendererKey;
  editable: boolean;
}

/**
 * Template D — stable enum-like value paired with translation keys, icon,
 * and dispatcher metadata. Consumers translate `labelKey`/`descriptionKey`
 * via `useT()` at render time.
 *
 * NOTE: `value` strings are stored in Prisma as plain `String` (no enum
 * constraint), so we keep them exactly as the existing camelCase identifiers.
 * Do not change them without a migration.
 */
export const TABLE_FIELD_TYPE_OPTIONS = [
  {
    value: "singleLineText",
    labelKey: "tables.field_types.singleLineText.label",
    descriptionKey: "tables.field_types.singleLineText.description",
    icon: Type,
    cellRenderer: "text",
    editable: true,
  },
  {
    value: "multilineText",
    labelKey: "tables.field_types.multilineText.label",
    descriptionKey: "tables.field_types.multilineText.description",
    icon: AlignLeft,
    cellRenderer: "text",
    editable: true,
  },
  {
    value: "number",
    labelKey: "tables.field_types.number.label",
    descriptionKey: "tables.field_types.number.description",
    icon: Hash,
    cellRenderer: "number",
    editable: true,
  },
  {
    value: "currency",
    labelKey: "tables.field_types.currency.label",
    descriptionKey: "tables.field_types.currency.description",
    icon: DollarSign,
    cellRenderer: "number",
    editable: true,
  },
  {
    value: "percent",
    labelKey: "tables.field_types.percent.label",
    descriptionKey: "tables.field_types.percent.description",
    icon: Percent,
    cellRenderer: "number",
    editable: true,
  },
  {
    value: "singleSelect",
    labelKey: "tables.field_types.singleSelect.label",
    descriptionKey: "tables.field_types.singleSelect.description",
    icon: List,
    cellRenderer: "select",
    editable: true,
  },
  {
    value: "multiSelect",
    labelKey: "tables.field_types.multiSelect.label",
    descriptionKey: "tables.field_types.multiSelect.description",
    icon: ListChecks,
    cellRenderer: "select",
    editable: true,
  },
  {
    value: "checkbox",
    labelKey: "tables.field_types.checkbox.label",
    descriptionKey: "tables.field_types.checkbox.description",
    icon: CheckSquare,
    cellRenderer: "checkbox",
    editable: true,
  },
  {
    value: "date",
    labelKey: "tables.field_types.date.label",
    descriptionKey: "tables.field_types.date.description",
    icon: Calendar,
    cellRenderer: "date",
    editable: true,
  },
  {
    value: "url",
    labelKey: "tables.field_types.url.label",
    descriptionKey: "tables.field_types.url.description",
    icon: Link2,
    cellRenderer: "url",
    editable: true,
  },
  {
    value: "email",
    labelKey: "tables.field_types.email.label",
    descriptionKey: "tables.field_types.email.description",
    icon: Mail,
    cellRenderer: "url",
    editable: true,
  },
  {
    value: "linkedRecord",
    labelKey: "tables.field_types.linkedRecord.label",
    descriptionKey: "tables.field_types.linkedRecord.description",
    icon: ArrowUpRight,
    cellRenderer: "linkedRecord",
    editable: true,
  },
  {
    value: "media",
    labelKey: "tables.field_types.media.label",
    descriptionKey: "tables.field_types.media.description",
    icon: ImageIcon,
    cellRenderer: "media",
    editable: true,
  },
  {
    value: "attachment",
    labelKey: "tables.field_types.attachment.label",
    descriptionKey: "tables.field_types.attachment.description",
    icon: Paperclip,
    cellRenderer: "media",
    editable: true,
  },
  {
    value: "createdTime",
    labelKey: "tables.field_types.createdTime.label",
    descriptionKey: "tables.field_types.createdTime.description",
    icon: Clock,
    cellRenderer: "date",
    editable: false,
  },
  {
    value: "lastModifiedTime",
    labelKey: "tables.field_types.lastModifiedTime.label",
    descriptionKey: "tables.field_types.lastModifiedTime.description",
    icon: History,
    cellRenderer: "date",
    editable: false,
  },
  {
    value: "autoNumber",
    labelKey: "tables.field_types.autoNumber.label",
    descriptionKey: "tables.field_types.autoNumber.description",
    icon: ListOrdered,
    cellRenderer: "number",
    editable: false,
  },
  {
    value: "formula",
    labelKey: "tables.field_types.formula.label",
    descriptionKey: "tables.field_types.formula.description",
    icon: Sigma,
    cellRenderer: "text",
    editable: false,
  },
  {
    value: "rollup",
    labelKey: "tables.field_types.rollup.label",
    descriptionKey: "tables.field_types.rollup.description",
    icon: TrendingUp,
    cellRenderer: "number",
    editable: false,
  },
  {
    value: "lookup",
    labelKey: "tables.field_types.lookup.label",
    descriptionKey: "tables.field_types.lookup.description",
    icon: Search,
    cellRenderer: "text",
    editable: false,
  },
  {
    value: "count",
    labelKey: "tables.field_types.count.label",
    descriptionKey: "tables.field_types.count.description",
    icon: HashCount,
    cellRenderer: "number",
    editable: false,
  },
] as const satisfies readonly TableFieldTypeMeta[];

/**
 * Lookup map by field type value.
 */
export const TABLE_FIELD_TYPE_MAP: Record<string, TableFieldTypeMeta> =
  Object.fromEntries(
    TABLE_FIELD_TYPE_OPTIONS.map((opt) => [opt.value, opt])
  );

/**
 * Backward-compat: derived registry mapping field type → renderer key + editable.
 * Consumers should prefer `TABLE_FIELD_TYPE_MAP` directly. Kept for renderer
 * dispatch code that only needs the lightweight shape.
 */
export const FIELD_TYPE_CONFIG: Record<
  string,
  { renderer: CellRendererKey; editable: boolean }
> = Object.fromEntries(
  TABLE_FIELD_TYPE_OPTIONS.map((opt) => [
    opt.value,
    { renderer: opt.cellRenderer, editable: opt.editable },
  ])
);
