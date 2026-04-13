"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Agent } from "@/types";
import { AGENT_STATUSES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { DynamicIcon } from "@/components/shared/icon-picker";

// Tabs
import { OverviewTab } from "./tabs/overview-tab";
import { ModelPromptTab } from "./tabs/model-prompt-tab";
import { KnowledgeTab } from "./tabs/knowledge-tab";
import { SkillsTab } from "./tabs/skills-tab";
import { ToolsTab } from "./tabs/tools-tab";
import { LimitsTab } from "./tabs/limits-tab";
import { TiersTab } from "./tabs/tiers-tab";
import { SettingsTab } from "./tabs/settings-tab";

// ─── Exported types for tab components ───────────────────────────────

export interface AgentFormState {
  name: string;
  key: string;
  description: string;
  longDescription: string;
  category: string;
  icon: string;
  iconUrl: string;
  status: string;
  sortOrder: string;
  // AI config
  modelType: string;
  modelProvider: string;
  modelId: string;
  systemPrompt: string;
  temperature: string;
  maxTokens: string;
  responseFormat: string;
  // Image config
  imageSize: string;
  imageStyle: string;
  imageQuality: string;
  // Video config
  videoDuration: string;
  videoResolution: string;
  videoAspectRatio: string;
  // Voice config
  voiceId: string;
  voiceSpeed: string;
  voiceStability: string;
  // Limits & cost
  dailyUsageLimit: string;
  monthlyCostEstimate: string;
  avgTokensPerCall: string;
  // Flags
  requiresMedia: boolean;
  requiresHealth: boolean;
  isConversational: boolean;
  // Meta
  version: string;
  tags: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function agentToForm(agent: Agent): AgentFormState {
  const a = agent as Record<string, unknown>;
  return {
    name: agent.name,
    key: agent.key,
    description: agent.description || "",
    longDescription: (a.longDescription as string) || "",
    category: agent.category,
    icon: agent.icon,
    iconUrl: (a.iconUrl as string) || "",
    status: agent.status,
    sortOrder: String(agent.sortOrder),
    modelType: (a.modelType as string) || "TEXT",
    modelProvider: (a.modelProvider as string) || "",
    modelId: (a.modelId as string) || "",
    systemPrompt: (a.systemPrompt as string) || "",
    temperature: a.temperature != null ? String(a.temperature) : "",
    maxTokens: a.maxTokens != null ? String(a.maxTokens) : "",
    responseFormat: (a.responseFormat as string) || "",
    imageSize: (a.imageSize as string) || "",
    imageStyle: (a.imageStyle as string) || "",
    imageQuality: (a.imageQuality as string) || "",
    videoDuration: a.videoDuration != null ? String(a.videoDuration) : "",
    videoResolution: (a.videoResolution as string) || "",
    videoAspectRatio: (a.videoAspectRatio as string) || "",
    voiceId: (a.voiceId as string) || "",
    voiceSpeed: a.voiceSpeed != null ? String(a.voiceSpeed) : "",
    voiceStability: a.voiceStability != null ? String(a.voiceStability) : "",
    dailyUsageLimit: a.dailyUsageLimit != null ? String(a.dailyUsageLimit) : "",
    monthlyCostEstimate:
      a.monthlyCostEstimate != null ? String(a.monthlyCostEstimate) : "",
    avgTokensPerCall:
      a.avgTokensPerCall != null ? String(a.avgTokensPerCall) : "",
    requiresMedia: agent.requiresMedia,
    requiresHealth: agent.requiresHealth,
    isConversational: agent.isConversational,
    version: agent.version,
    tags: agent.tags.join(", "),
  };
}

function formToPayload(form: AgentFormState) {
  return {
    name: form.name,
    key: form.key,
    description: form.description || undefined,
    longDescription: form.longDescription || undefined,
    category: form.category,
    icon: form.icon || "bot",
    status: form.status,
    sortOrder: parseInt(form.sortOrder) || 0,
    modelType: form.modelType || "TEXT",
    modelProvider: form.modelProvider || undefined,
    modelId: form.modelId || undefined,
    systemPrompt: form.systemPrompt || undefined,
    temperature: form.temperature ? parseFloat(form.temperature) : undefined,
    maxTokens: form.maxTokens ? parseInt(form.maxTokens) : undefined,
    responseFormat: form.responseFormat || undefined,
    imageSize: form.imageSize || undefined,
    imageStyle: form.imageStyle || undefined,
    imageQuality: form.imageQuality || undefined,
    videoDuration: form.videoDuration ? parseInt(form.videoDuration) : undefined,
    videoResolution: form.videoResolution || undefined,
    videoAspectRatio: form.videoAspectRatio || undefined,
    voiceId: form.voiceId || undefined,
    voiceSpeed: form.voiceSpeed ? parseFloat(form.voiceSpeed) : undefined,
    voiceStability: form.voiceStability ? parseFloat(form.voiceStability) : undefined,
    dailyUsageLimit: form.dailyUsageLimit
      ? parseInt(form.dailyUsageLimit)
      : undefined,
    monthlyCostEstimate: form.monthlyCostEstimate
      ? parseFloat(form.monthlyCostEstimate)
      : undefined,
    avgTokensPerCall: form.avgTokensPerCall
      ? parseInt(form.avgTokensPerCall)
      : undefined,
    requiresMedia: form.requiresMedia,
    requiresHealth: form.requiresHealth,
    isConversational: form.isConversational,
    version: form.version || "1.0",
    tags: form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-1.5 py-0">
          Active
        </Badge>
      );
    case "BETA":
      return (
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[11px] px-1.5 py-0">
          Beta
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] px-1.5 py-0">
          Draft
        </Badge>
      );
    case "DEPRECATED":
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[11px] px-1.5 py-0">
          Deprecated
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Props ───────────────────────────────────────────────────────────

interface AgentDetailClientProps {
  agentId?: string;
  initialAgent?: Agent;
  allTiers?: { id: string; name: string }[];
}

// ─── Component ───────────────────────────────────────────────────────

export function AgentDetailClient({
  agentId,
  initialAgent,
  allTiers,
}: AgentDetailClientProps) {
  const router = useRouter();
  const [form, setForm] = useState<AgentFormState>(
    initialAgent ? agentToForm(initialAgent) : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Duplicate modal
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) return;

    // Create mode
    if (!agentId) {
      if (!form.key.trim()) {
        toast.error("Key is required");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formToPayload(form)),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || "Failed to create agent");
          return;
        }
        const json = await res.json();
        toast.success("Agent created");
        router.push(`/admin/blocks/agents/${json.data.id}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Edit mode
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [form, agentId, router]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: duplicateName.trim(),
          key: `${form.key}_copy_${Date.now()}`,
          status: "DRAFT",
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const newAgent = await res.json();
      toast.success("Agent duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/blocks/agents/${newAgent.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, router]);

  const handleDelete = useCallback(async () => {
    if (!agentId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Agent deleted");
      setDeleteOpen(false);
      router.push("/admin/blocks/agents");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [agentId, router]);

  return (
    <div className="flex flex-col -m-6 min-h-[100vh]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/blocks/agents"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            AI Agents
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-6 w-6 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {form.iconUrl ? (
              <Image
                src={form.iconUrl}
                alt=""
                width={24}
                height={24}
                className="h-full w-full object-cover"
              />
            ) : (
              <DynamicIcon
                name={form.icon}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
            )}
          </div>
          <span className="text-foreground font-medium">
            {form.name || "New Agent"}
          </span>
          <div className="ml-1">{statusBadge(form.status)}</div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Status select */}
          <Select
            value={form.status}
            onValueChange={(val) => {
              updateForm("status", val ?? "DRAFT");
              if (agentId) {
                fetch(`/api/agents/${agentId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: val }),
                }).then(() =>
                  toast.success(`Status changed to ${val?.toLowerCase()}`)
                );
              }
            }}
          >
            <SelectTrigger className="w-[130px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Save button */}
          <Button
            size="sm"
            className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving
              </>
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Saved
              </>
            ) : agentId ? (
              "Save"
            ) : (
              "Create"
            )}
          </Button>

          {/* Actions menu */}
          {agentId && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateName(`${form.name} (Copy)`);
                    setDuplicateOpen(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4 shrink-0">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="model">Model & Prompt</TabsTrigger>
            {agentId && <TabsTrigger value="knowledge">Knowledge</TabsTrigger>}
            {agentId && <TabsTrigger value="skills">Skills</TabsTrigger>}
            {agentId && <TabsTrigger value="tools">Tools</TabsTrigger>}
            <TabsTrigger value="limits">Limits & Cost</TabsTrigger>
            {agentId && <TabsTrigger value="tiers">Tiers</TabsTrigger>}
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab
              form={form}
              updateForm={updateForm}
              onBlurSave={handleSave}
              isNew={!agentId}
              agentId={agentId}
            />
          </TabsContent>

          <TabsContent value="model" className="mt-0">
            <ModelPromptTab
              form={form}
              updateForm={updateForm}
              onBlurSave={handleSave}
            />
          </TabsContent>

          {agentId && (
            <TabsContent value="knowledge" className="mt-0">
              <KnowledgeTab agentId={agentId} />
            </TabsContent>
          )}

          {agentId && (
            <TabsContent value="skills" className="mt-0">
              <SkillsTab agentId={agentId} />
            </TabsContent>
          )}

          {agentId && (
            <TabsContent value="tools" className="mt-0">
              <ToolsTab agentId={agentId} />
            </TabsContent>
          )}

          <TabsContent value="limits" className="mt-0">
            <LimitsTab
              form={form}
              updateForm={updateForm}
              onBlurSave={handleSave}
            />
          </TabsContent>

          {agentId && (
            <TabsContent value="tiers" className="mt-0">
              <TiersTab agentId={agentId} allTiers={allTiers || []} />
            </TabsContent>
          )}

          <TabsContent value="settings" className="mt-0">
            <SettingsTab
              form={form}
              updateForm={updateForm}
              onBlurSave={handleSave}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Agent
            </DialogTitle>
            <DialogDescription>
              Create a copy of this agent with a new name. All configuration will
              be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent Name</label>
            <Input
              placeholder="Agent name..."
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateOpen(false)}
              disabled={duplicating}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete Agent
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{form.name}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Default form for new agents ────────────────────────────────────

const DEFAULT_FORM: AgentFormState = {
  name: "",
  key: "",
  description: "",
  longDescription: "",
  category: "NUTRITION",
  icon: "bot",
  iconUrl: "",
  status: "DRAFT",
  sortOrder: "0",
  modelType: "TEXT",
  modelProvider: "",
  modelId: "",
  systemPrompt: "",
  temperature: "",
  maxTokens: "",
  responseFormat: "",
  imageSize: "",
  imageStyle: "",
  imageQuality: "",
  videoDuration: "",
  videoResolution: "",
  videoAspectRatio: "",
  voiceId: "",
  voiceSpeed: "",
  voiceStability: "",
  dailyUsageLimit: "",
  monthlyCostEstimate: "",
  avgTokensPerCall: "",
  requiresMedia: false,
  requiresHealth: false,
  isConversational: false,
  version: "1.0",
  tags: "",
};
