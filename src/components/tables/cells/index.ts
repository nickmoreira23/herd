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

// Registry mapping field type to renderer/editor
export const FIELD_TYPE_CONFIG: Record<
  string,
  {
    renderer: string;
    editable: boolean;
  }
> = {
  singleLineText: { renderer: "text", editable: true },
  multilineText: { renderer: "text", editable: true },
  number: { renderer: "number", editable: true },
  currency: { renderer: "number", editable: true },
  percent: { renderer: "number", editable: true },
  singleSelect: { renderer: "select", editable: true },
  multiSelect: { renderer: "select", editable: true },
  checkbox: { renderer: "checkbox", editable: true },
  date: { renderer: "date", editable: true },
  url: { renderer: "url", editable: true },
  email: { renderer: "url", editable: true },
  linkedRecord: { renderer: "linkedRecord", editable: true },
  media: { renderer: "media", editable: true },
  attachment: { renderer: "media", editable: true },
  createdTime: { renderer: "date", editable: false },
  lastModifiedTime: { renderer: "date", editable: false },
  autoNumber: { renderer: "number", editable: false },
  formula: { renderer: "text", editable: false },
  rollup: { renderer: "number", editable: false },
  lookup: { renderer: "text", editable: false },
  count: { renderer: "number", editable: false },
};
