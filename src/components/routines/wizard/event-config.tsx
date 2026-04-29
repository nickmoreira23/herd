"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell } from "lucide-react";
import {
  BLOCK_EVENTS,
  eventBlocks,
  eventsForBlock,
  findEvent,
} from "@/lib/routines/events/registry";

interface EventConfigProps {
  block: string | null;
  type: string | null;
  onChange: (block: string | null, type: string | null) => void;
}

export function EventConfig({ block, type, onChange }: EventConfigProps) {
  const blocks = useMemo(() => eventBlocks().sort(), []);
  const blockEvents = useMemo(
    () => (block ? eventsForBlock(block) : []),
    [block]
  );
  const event = useMemo(
    () => (block && type ? findEvent(block, type) : null),
    [block, type]
  );

  function changeBlock(b: string) {
    // Reset type whenever the block changes
    onChange(b, null);
  }

  function changeType(t: string) {
    onChange(block, t);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Block</Label>
          <Select value={block ?? ""} onValueChange={changeBlock}>
            <SelectTrigger>
              <SelectValue placeholder="Select block" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Event</Label>
          <Select
            value={type ?? ""}
            onValueChange={changeType}
            disabled={!block || blockEvents.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {blockEvents.map((e) => (
                <SelectItem key={e.eventType} value={e.eventType}>
                  {e.eventType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {event && (
        <div className="rounded-md border bg-muted/30 p-3 space-y-3">
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {event.blockName}.{event.eventType}
              </div>
              <div className="text-xs text-muted-foreground">
                {event.wired
                  ? "Live — fires from the API today."
                  : "Registered, but the dispatcher is not wired yet."}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Payload variables
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {event.payload.map((p) => (
                <div key={p.name} className="flex items-baseline gap-1.5">
                  <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px]">
                    {`{{${p.name}}}`}
                  </code>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {p.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Example payload
            </div>
            <pre className="text-[10px] bg-background border rounded p-2 overflow-x-auto">
              {JSON.stringify(event.examplePayload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {block && !event && blockEvents.length === 0 && (
        <div className="text-xs text-muted-foreground border border-dashed rounded p-3 text-center">
          No registered events for this block yet.
        </div>
      )}

      {!block && (
        <div className="text-xs text-muted-foreground">
          {BLOCK_EVENTS.length} events available across {blocks.length} blocks.
        </div>
      )}
    </div>
  );
}

/** Resolve which payload variables are exposed to a routine's prompt template. */
export function variablesForEvent(
  block: string | null,
  type: string | null
): { name: string; type: string; description: string }[] {
  if (!block || !type) return [];
  const event = findEvent(block, type);
  return event?.payload ?? [];
}
