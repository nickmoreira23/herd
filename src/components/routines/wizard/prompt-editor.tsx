"use client";

import { useRef, useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Play, Loader2 } from "lucide-react";
import { variablesForEvent } from "./event-config";
import type { InputRow } from "./inputs-editor";

export interface PromptVariable {
  name: string;
  description: string;
  source: "input" | "event" | "system";
}

interface PromptEditorProps {
  template: string;
  onTemplateChange: (template: string) => void;
  outputFormat: "text" | "json" | "markdown";
  onOutputFormatChange: (format: "text" | "json" | "markdown") => void;

  /** Default inputs, used to suggest variables and seed test renders. */
  inputs: InputRow[];
  /** When trigger is EVENT, drives the second variable group. */
  eventBlock: string | null;
  eventType: string | null;

  /** When set, enables the "Test agent" button (needs a chosen agent). */
  agentId: string | null;
}

export function PromptEditor({
  template,
  onTemplateChange,
  outputFormat,
  onOutputFormatChange,
  inputs,
  eventBlock,
  eventType,
  agentId,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variables = useMemo<PromptVariable[]>(() => {
    const vs: PromptVariable[] = [];
    for (const row of inputs) {
      if (row.key)
        vs.push({
          name: row.key,
          description: `Default input (${row.type})`,
          source: "input",
        });
    }
    for (const ev of variablesForEvent(eventBlock, eventType)) {
      // Don't duplicate keys already listed by inputs
      if (!vs.find((v) => v.name === ev.name))
        vs.push({
          name: ev.name,
          description: `${ev.type} · ${ev.description}`,
          source: "event",
        });
    }
    return vs;
  }, [inputs, eventBlock, eventType]);

  function insertVariable(name: string) {
    const ta = textareaRef.current;
    if (!ta) {
      onTemplateChange(template + `{{${name}}}`);
      return;
    }
    const start = ta.selectionStart ?? template.length;
    const end = ta.selectionEnd ?? start;
    const next =
      template.slice(0, start) + `{{${name}}}` + template.slice(end);
    onTemplateChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + `{{${name}}}`.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  // Test render — local interpolation with example values
  const [testInputJson, setTestInputJson] = useState<string>(() => {
    // Seed with the input keys' current values + event example payload
    const seed: Record<string, unknown> = {};
    for (const row of inputs) {
      if (!row.key) continue;
      seed[row.key] =
        row.type === "boolean"
          ? row.value === "true"
          : row.type === "number"
            ? Number(row.value) || 0
            : row.value;
    }
    return JSON.stringify(seed, null, 2);
  });
  const [testRendered, setTestRendered] = useState<string | null>(null);
  const [testParseError, setTestParseError] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<{
    output: string;
    durationMs: number;
    promptTokens: number;
    completionTokens: number;
  } | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function localRender() {
    setTestRendered(null);
    setAgentResponse(null);
    setAgentError(null);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(testInputJson || "{}");
      setTestParseError(null);
    } catch (e) {
      setTestParseError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setTestRendered(
      template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
        const v = key.split(".").reduce<unknown>(
          (acc, k) =>
            acc && typeof acc === "object"
              ? (acc as Record<string, unknown>)[k]
              : undefined,
          parsed
        );
        if (v == null) return "";
        if (typeof v === "string") return v;
        return JSON.stringify(v);
      })
    );
  }

  async function testAgent() {
    if (!agentId) return;
    setRunning(true);
    setAgentResponse(null);
    setAgentError(null);
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(testInputJson || "{}");
      setTestParseError(null);
    } catch (e) {
      setTestParseError(e instanceof Error ? e.message : "Invalid JSON");
      setRunning(false);
      return;
    }
    try {
      const res = await fetch("/api/routines/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          promptTemplate: template,
          input: parsed,
          outputFormat,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAgentError(json.error || "Preview failed");
        return;
      }
      setTestRendered(json.data.renderedPrompt);
      setAgentResponse({
        output: json.data.output,
        durationMs: json.data.durationMs,
        promptTokens: json.data.promptTokens,
        completionTokens: json.data.completionTokens,
      });
    } catch (e) {
      setAgentError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
      {/* Editor */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Prompt template
          </Label>
          <Textarea
            ref={textareaRef}
            value={template}
            onChange={(e) => onTemplateChange(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder="Use {{variable}} placeholders rendered against the trigger payload + default inputs."
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Output format</Label>
          <Select
            value={outputFormat}
            onValueChange={(v) =>
              onOutputFormatChange(v as "text" | "json" | "markdown")
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Variables panel */}
      <div className="rounded-md border bg-muted/30 p-3 space-y-2 self-start">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Available variables</span>
        </div>
        {variables.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Add inputs in the previous step or pick an event trigger to expose
            payload variables.
          </p>
        ) : (
          <div className="space-y-1">
            {variables.map((v) => (
              <button
                key={v.name + v.source}
                type="button"
                onClick={() => insertVariable(v.name)}
                className="block w-full text-left rounded px-2 py-1 hover:bg-background"
              >
                <code className="text-[11px] font-mono">{`{{${v.name}}}`}</code>
                <div className="text-[10px] text-muted-foreground truncate">
                  {v.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Test panel — full width */}
      <div className="lg:col-span-2 rounded-md border p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Test render</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={localRender}
            disabled={!template.trim()}
          >
            Render
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={testAgent}
            disabled={!template.trim() || !agentId || running}
            className="gap-1"
          >
            {running ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            Test agent
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Sample input (JSON)
            </Label>
            <Textarea
              value={testInputJson}
              onChange={(e) => setTestInputJson(e.target.value)}
              rows={6}
              className="font-mono text-[11px]"
            />
            {testParseError && (
              <p className="text-[10px] text-rose-500">{testParseError}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Rendered prompt
            </Label>
            <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 rounded p-2 min-h-[120px]">
              {testRendered ?? "—"}
            </pre>
          </div>
        </div>
        {agentResponse && (
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Agent response · {agentResponse.durationMs} ms · ↑
              {agentResponse.promptTokens} ↓ {agentResponse.completionTokens}
            </Label>
            <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 rounded p-2">
              {agentResponse.output}
            </pre>
          </div>
        )}
        {agentError && (
          <p className="text-[11px] text-rose-500">{agentError}</p>
        )}
      </div>
    </div>
  );
}
