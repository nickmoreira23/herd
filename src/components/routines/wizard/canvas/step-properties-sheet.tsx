"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Play, Trash2 } from "lucide-react";
import { InfoTip } from "@/components/tiers/info-tip";
import { AgentBrowser } from "../agent-browser";
import type { CanvasStep } from "./canvas-types";

interface StepPropertiesSheetProps {
  step: CanvasStep | null;
  isFirstStep: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (patch: Partial<CanvasStep>) => void;
  onDelete: () => void;
}

export function StepPropertiesSheet({
  step,
  isFirstStep,
  open,
  onOpenChange,
  onChange,
  onDelete,
}: StepPropertiesSheetProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOutput, setPreviewOutput] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sampleInput, setSampleInput] = useState("{}");

  if (!step) return null;

  async function testStep() {
    if (!step?.agentId || !step.promptTemplate) return;
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewOutput(null);
    let parsed: unknown = {};
    try {
      parsed = JSON.parse(sampleInput || "{}");
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Invalid JSON");
      setPreviewLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/routines/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: step.agentId,
          promptTemplate: step.promptTemplate,
          input: parsed,
          outputFormat: step.outputFormat,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPreviewError(json.error || "Preview failed");
        return;
      }
      setPreviewOutput(json.data.output);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Step {step.stepOrder}</SheetTitle>
          <SheetDescription>
            What this step does and which agent runs it.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Step name (optional)
              <InfoTip text="Short label shown on the canvas. If empty, uses 'Step N'." />
            </Label>
            <Input
              value={step.name ?? ""}
              onChange={(e) => onChange({ name: e.target.value || null })}
              placeholder="e.g. Summarise deals"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Agent
              <InfoTip text="Which agent runs this step. The agent's system prompt and model settings are used." />
            </Label>
            <AgentBrowser
              value={step.agentId}
              onChange={(id, agent) => onChange({ agentId: id, agentName: agent.name })}
            />
          </div>

          {!isFirstStep && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Input source
                <InfoTip text="Where this step gets its data. Use 'previous step output' to chain steps; use 'trigger payload' to give every step the original event/inputs." />
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ inputSource: "trigger" })}
                  className={`text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                    step.inputSource === "trigger"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="font-medium">Trigger payload</div>
                  <div className="text-muted-foreground">Original event + defaults</div>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ inputSource: "step" })}
                  className={`text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                    step.inputSource === "step"
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="font-medium">Previous step</div>
                  <div className="text-muted-foreground">{`Use {{previousOutput}}`}</div>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Prompt template
              <InfoTip text="Text sent to the agent. Use {{variable}} to interpolate trigger payload, default inputs, or {{previousOutput}} from the prior step." />
            </Label>
            <Textarea
              value={step.promptTemplate}
              onChange={(e) => onChange({ promptTemplate: e.target.value })}
              rows={6}
              className="font-mono text-xs"
              placeholder="What should the agent do? Use {{variable}} placeholders."
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Output format
              <InfoTip text="Hint about how the agent should reply. JSON tries to parse the response as structured data." />
            </Label>
            <Select
              value={step.outputFormat}
              onValueChange={(v) =>
                onChange({ outputFormat: v as "text" | "json" | "markdown" })
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

          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Test this step</span>
              <InfoTip text="Calls the agent with sample input — without saving anything. Useful to validate the prompt before the routine fires." />
            </div>
            <Textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              rows={3}
              className="font-mono text-[11px]"
              placeholder='{"name":"Maria"}'
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={testStep}
                disabled={!step.agentId || !step.promptTemplate || previewLoading}
                className="gap-1"
              >
                {previewLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                Run preview
              </Button>
            </div>
            {previewError && (
              <p className="text-[11px] text-rose-500">{previewError}</p>
            )}
            {previewOutput && (
              <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 rounded p-2 max-h-40 overflow-y-auto">
                {previewOutput}
              </pre>
            )}
          </div>

          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="text-rose-500 hover:text-rose-600 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete step
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
