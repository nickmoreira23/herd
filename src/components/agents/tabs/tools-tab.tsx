"use client";

import { useState, useEffect, useCallback } from "react";
import { AGENT_TOOL_AUTH_TYPES } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface AgentToolItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
  toolSchema: unknown;
  endpointUrl: string | null;
  httpMethod: string;
  authType: string;
  timeoutMs: number;
  isEnabled: boolean;
  rateLimitPerMinute: number | null;
  sortOrder: number;
}

interface ToolsTabProps {
  agentId: string;
}

const AUTH_COLORS: Record<string, string> = {
  NONE: "border-zinc-500/50 bg-zinc-500/10 text-zinc-400",
  API_KEY: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  OAUTH2: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  BEARER_TOKEN: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  CUSTOM_HEADER: "border-purple-500/50 bg-purple-500/10 text-purple-400",
};

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function ToolsTab({ agentId }: ToolsTabProps) {
  const [tools, setTools] = useState<AgentToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [schemaValid, setSchemaValid] = useState<Record<string, boolean | null>>({});

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/tools`);
      const json = await res.json();
      setTools(json.data || []);
    } catch {
      toast.error("Failed to load tools");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const addTool = async () => {
    const name = `Tool ${tools.length + 1}`;
    try {
      const res = await fetch(`/api/agents/${agentId}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key: toSlug(name) }),
      });
      if (!res.ok) {
        toast.error("Failed to create");
        return;
      }
      const json = await res.json();
      setTools((prev) => [...prev, json.data]);
      setExpanded((prev) => new Set(prev).add(json.data.id));
      toast.success("Tool added");
    } catch {
      toast.error("Failed to create");
    }
  };

  const updateTool = async (
    toolId: string,
    field: string,
    value: unknown
  ) => {
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, [field]: value } : t))
    );
    try {
      const res = await fetch(`/api/agents/${agentId}/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) toast.error("Failed to save");
    } catch {
      toast.error("Failed to save");
    }
  };

  const deleteTool = async (toolId: string) => {
    try {
      await fetch(`/api/agents/${agentId}/tools/${toolId}`, {
        method: "DELETE",
      });
      setTools((prev) => prev.filter((t) => t.id !== toolId));
      toast.success("Tool deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const validateSchema = (toolId: string, schemaStr: string) => {
    try {
      const parsed = JSON.parse(schemaStr);
      setSchemaValid((prev) => ({ ...prev, [toolId]: true }));
      updateTool(toolId, "toolSchema", parsed);
    } catch {
      setSchemaValid((prev) => ({ ...prev, [toolId]: false }));
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading tools...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Tools</span>
          <span className="text-xs text-muted-foreground ml-1">
            {tools.filter((t) => t.isEnabled).length} of {tools.length} enabled
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={addTool}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Tool
        </Button>
      </div>

      <div className="space-y-2">
        {tools.map((tool) => {
          const isExpanded = expanded.has(tool.id);
          return (
            <div
              key={tool.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleExpand(tool.id)}
                  className="shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tool.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {tool.key}
                    </span>
                    {tool.endpointUrl && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                        {tool.endpointUrl}
                      </span>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${AUTH_COLORS[tool.authType] || ""}`}
                >
                  {tool.authType.replace("_", " ")}
                </Badge>
                <Switch
                  checked={tool.isEnabled}
                  onCheckedChange={(val) =>
                    updateTool(tool.id, "isEnabled", val)
                  }
                />
              </div>

              {isExpanded && (
                <div className="border-t px-4 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        value={tool.name}
                        onChange={(e) =>
                          setTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? { ...t, name: e.target.value }
                                : t
                            )
                          )
                        }
                        onBlur={() => updateTool(tool.id, "name", tool.name)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key</Label>
                      <Input
                        value={tool.key}
                        onChange={(e) =>
                          setTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? { ...t, key: e.target.value }
                                : t
                            )
                          )
                        }
                        onBlur={() => updateTool(tool.id, "key", tool.key)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={tool.description || ""}
                      onChange={(e) =>
                        setTools((prev) =>
                          prev.map((t) =>
                            t.id === tool.id
                              ? { ...t, description: e.target.value }
                              : t
                          )
                        )
                      }
                      onBlur={() =>
                        updateTool(tool.id, "description", tool.description)
                      }
                      placeholder="What does this tool do? (shown to the LLM)"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Endpoint URL</Label>
                      <Input
                        value={tool.endpointUrl || ""}
                        onChange={(e) =>
                          setTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? { ...t, endpointUrl: e.target.value }
                                : t
                            )
                          )
                        }
                        onBlur={() =>
                          updateTool(tool.id, "endpointUrl", tool.endpointUrl)
                        }
                        placeholder="https://api.example.com/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>HTTP Method</Label>
                      <Select
                        value={tool.httpMethod}
                        onValueChange={(val) =>
                          updateTool(tool.id, "httpMethod", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Auth Type</Label>
                      <Select
                        value={tool.authType}
                        onValueChange={(val) =>
                          updateTool(tool.id, "authType", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGENT_TOOL_AUTH_TYPES.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={tool.timeoutMs}
                        onChange={(e) =>
                          setTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? {
                                    ...t,
                                    timeoutMs: parseInt(e.target.value) || 30000,
                                  }
                                : t
                            )
                          )
                        }
                        onBlur={() =>
                          updateTool(tool.id, "timeoutMs", tool.timeoutMs)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rate Limit (per minute)</Label>
                      <Input
                        type="number"
                        value={tool.rateLimitPerMinute ?? ""}
                        onChange={(e) =>
                          setTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? {
                                    ...t,
                                    rateLimitPerMinute: e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  }
                                : t
                            )
                          )
                        }
                        onBlur={() =>
                          updateTool(
                            tool.id,
                            "rateLimitPerMinute",
                            tool.rateLimitPerMinute
                          )
                        }
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>

                  {/* Tool Schema */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Tool Schema (JSON)</Label>
                      <div className="flex items-center gap-2">
                        {schemaValid[tool.id] === true && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        )}
                        {schemaValid[tool.id] === false && (
                          <span className="flex items-center gap-1 text-[10px] text-red-400">
                            <XCircle className="h-3 w-3" /> Invalid JSON
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-[10px]"
                          onClick={() => {
                            const el = document.getElementById(
                              `schema-${tool.id}`
                            ) as HTMLTextAreaElement;
                            if (el) validateSchema(tool.id, el.value);
                          }}
                        >
                          Validate
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id={`schema-${tool.id}`}
                      defaultValue={
                        tool.toolSchema
                          ? JSON.stringify(tool.toolSchema, null, 2)
                          : ""
                      }
                      placeholder='{\n  "type": "object",\n  "properties": { ... }\n}'
                      rows={8}
                      className="font-mono text-xs"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          validateSchema(tool.id, e.target.value);
                        }
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      JSON Schema for the tool&apos;s parameters (OpenAI/Anthropic
                      function calling format)
                    </p>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => deleteTool(tool.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tools.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No tools defined yet. Add external tools and functions this agent
            can invoke.
          </div>
        )}
      </div>
    </div>
  );
}
