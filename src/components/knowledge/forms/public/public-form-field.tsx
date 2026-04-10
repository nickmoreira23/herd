"use client";

import { useRef, useState, useEffect, useCallback, type MouseEvent, type TouchEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, RotateCcw } from "lucide-react";

interface FieldDef {
  id: string;
  label: string;
  type: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  options: { choices: string[] } | null;
  validation: Record<string, unknown> | null;
}

interface PublicFormFieldProps {
  field: FieldDef;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
  error?: string;
}

// ─── Signature Pad Component ───────────────────────────────────────────────

function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (data: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // If there's existing data, restore it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getPosition = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      if ("touches" in e) {
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
      }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
    },
    []
  );

  const startDrawing = useCallback(
    (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      setIsDrawing(true);
      setHasDrawn(true);
      const pos = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    },
    [getPosition]
  );

  const draw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      const pos = getPosition(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    },
    [isDrawing, getPosition]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export as data URL
    onChange(canvas.toDataURL("image/png"));
  }, [isDrawing, onChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    onChange("");
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg border-2 border-dashed bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: 150 }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Draw your signature here</p>
          </div>
        )}
      </div>
      {hasDrawn && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

// ─── File Upload Component ─────────────────────────────────────────────────

function FileUploadField({
  value,
  onChange,
  validation,
}: {
  value: unknown;
  onChange: (data: { name: string; size: number; type: string; data: string } | null) => void;
  validation: Record<string, unknown> | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileData = value as { name: string; size: number; type: string; data?: string } | null;
  const [error, setError] = useState<string | null>(null);

  const maxSize = (validation?.maxFileSize as number) || 10 * 1024 * 1024; // 10MB default
  const allowedTypes = (validation?.allowedFileTypes as string[]) || [];

  function handleFileSelect(file: File) {
    setError(null);

    // Validate size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${formatSize(maxSize)}.`);
      return;
    }

    // Validate type
    if (allowedTypes.length > 0) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const typeMatch = allowedTypes.some(
        (t) => file.type === t || `.${ext}` === t || ext === t
      );
      if (!typeMatch) {
        setError(`File type not allowed. Accepted: ${allowedTypes.join(", ")}`);
        return;
      }
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function removeFile() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {fileData?.name ? (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileData.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(fileData.size)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={removeFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          className="rounded-lg border-2 border-dashed bg-muted/10 px-6 py-8 text-center cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {formatSize(maxSize)}
            {allowedTypes.length > 0 && ` | ${allowedTypes.join(", ")}`}
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={allowedTypes.length > 0 ? allowedTypes.join(",") : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main Field Component ──────────────────────────────────────────────────

export function PublicFormField({
  field,
  value,
  onChange,
  error,
}: PublicFormFieldProps) {
  const strValue = (value as string) ?? "";
  const numValue = value as number | undefined;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {field.label}
        {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {renderInput()}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );

  function renderInput() {
    switch (field.type) {
      case "TEXT":
        return (
          <Input
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
          />
        );

      case "TEXTAREA":
        return (
          <Textarea
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
            rows={4}
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            value={numValue ?? ""}
            onChange={(e) =>
              onChange(field.id, e.target.value ? Number(e.target.value) : "")
            }
            placeholder={field.placeholder || undefined}
          />
        );

      case "EMAIL":
        return (
          <Input
            type="email"
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
          />
        );

      case "PHONE":
        return (
          <Input
            type="tel"
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || "+1 (555) 000-0000"}
          />
        );

      case "DATE":
        return (
          <Input
            type="date"
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case "TIME":
        return (
          <Input
            type="time"
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
        );

      case "SELECT":
        return (
          <Select
            value={strValue}
            onValueChange={(v) => onChange(field.id, v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.choices?.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "MULTI_SELECT":
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice) => {
              const selected = Array.isArray(value)
                ? (value as string[]).includes(choice)
                : false;
              return (
                <label
                  key={choice}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = Array.isArray(value)
                        ? (value as string[])
                        : [];
                      const next = selected
                        ? current.filter((c) => c !== choice)
                        : [...current, choice];
                      onChange(field.id, next);
                    }}
                    className="rounded border-input"
                  />
                  <span className="text-sm">{choice}</span>
                </label>
              );
            })}
          </div>
        );

      case "RADIO":
        return (
          <div className="space-y-2">
            {field.options?.choices?.map((choice) => (
              <label
                key={choice}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={strValue === choice}
                  onChange={() => onChange(field.id, choice)}
                  className="border-input"
                />
                <span className="text-sm">{choice}</span>
              </label>
            ))}
          </div>
        );

      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value === true}
              onCheckedChange={(checked) => onChange(field.id, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {field.placeholder || "Yes"}
            </span>
          </div>
        );

      case "YES_NO":
        return (
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                value === true
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                  : "hover:bg-accent"
              }`}
              onClick={() => onChange(field.id, true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                value === false
                  ? "border-red-500 bg-red-500/10 text-red-600"
                  : "hover:bg-accent"
              }`}
              onClick={() => onChange(field.id, false)}
            >
              No
            </button>
          </div>
        );

      case "RATING": {
        const maxRating = (field.validation?.maxRating as number) || 10;
        const currentRating = (value as number) || 0;
        return (
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`h-10 w-10 rounded-lg border text-sm font-medium transition-colors ${
                  n <= currentRating
                    ? "border-yellow-500 bg-yellow-500/20 text-yellow-600 font-bold"
                    : "hover:bg-accent"
                }`}
                onClick={() => onChange(field.id, n)}
              >
                {n}
              </button>
            ))}
          </div>
        );
      }

      case "FILE_UPLOAD":
        return (
          <FileUploadField
            value={value}
            onChange={(fileData) => onChange(field.id, fileData)}
            validation={field.validation}
          />
        );

      case "SIGNATURE":
        return (
          <SignaturePad
            value={strValue}
            onChange={(data) => onChange(field.id, data)}
          />
        );

      default:
        return (
          <Input
            value={strValue}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={field.placeholder || undefined}
          />
        );
    }
  }
}
