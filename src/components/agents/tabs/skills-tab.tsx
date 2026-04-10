"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Search,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Globe,
  Check,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

interface AgentSkill {
  id: string;
  name: string;
  key: string;
  description: string | null;
  promptFragment: string | null;
  isEnabled: boolean;
  requiresTools: string[];
  category: string | null;
  sortOrder: number;
}

interface RegistrySkill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface SkillDetail {
  skillId: string;
  source: string;
  name: string;
  description: string;
  content: string;
}

interface SkillsTabProps {
  agentId: string;
}

// ─── Constants ───────────────────────────────────────────────────────

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  core: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  advanced: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  experimental: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  imported: "border-violet-500/50 bg-violet-500/10 text-violet-400",
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Skills Registry Modal ───────────────────────────────────────────

function SkillsRegistryModal({
  open,
  onOpenChange,
  agentId,
  installedKeys,
  onInstalled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  installedKeys: Set<string>;
  onInstalled: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrySkill[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<RegistrySkill | null>(
    null
  );
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchSkills = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/skills-registry/search?q=${encodeURIComponent(q)}&limit=20`
      );
      const json = await res.json();
      setResults(json.skills || []);
    } catch {
      toast.error("Failed to search skills registry");
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSkills(value), 400);
  };

  const viewDetail = async (skill: RegistrySkill) => {
    setSelectedSkill(skill);
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(
        `/api/skills-registry/detail?source=${encodeURIComponent(skill.source)}&skillId=${encodeURIComponent(skill.skillId)}`
      );
      const json = await res.json();
      setDetail(json);
    } catch {
      toast.error("Failed to load skill details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const importSkill = async (skill: RegistrySkill) => {
    setImporting(skill.skillId);
    try {
      const res = await fetch("/api/skills-registry/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          skillId: skill.skillId,
          source: skill.source,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Imported "${skill.name || skill.skillId}"`);
        onInstalled();
        // Go back to search view if we were in detail
        setSelectedSkill(null);
        setDetail(null);
      } else {
        toast.error(json.error || "Import failed");
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(null);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedSkill(null);
      setDetail(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div>
              <DialogTitle className="flex items-center gap-2">
                Skills Registry
                <Badge variant="outline" className="text-[10px] font-normal">
                  skills.sh
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Browse and import skills from the open agent skills ecosystem.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Detail View */}
        {selectedSkill ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            <button
              onClick={() => {
                setSelectedSkill(null);
                setDetail(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to results
            </button>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : detail ? (
              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{detail.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {detail.source}/{detail.skillId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      {formatInstalls(selectedSkill.installs)} installs
                    </div>
                  </div>

                  {detail.description && (
                    <p className="text-sm text-muted-foreground">
                      {detail.description}
                    </p>
                  )}
                </div>

                {detail.content ? (
                  <div className="flex-1 overflow-hidden flex flex-col space-y-1.5">
                    <Label className="text-xs">Prompt Content</Label>
                    <ScrollArea className="flex-1 max-h-[280px] rounded-lg border bg-muted/30 p-3">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {detail.content}
                      </pre>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/30">
                    No preview content available. The skill will be imported
                    with its metadata.
                  </div>
                )}

                <DialogFooter>
                  {installedKeys.has(selectedSkill.skillId) ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Already Installed
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => importSkill(selectedSkill)}
                      disabled={importing === selectedSkill.skillId}
                    >
                      {importing === selectedSkill.skillId ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Import Skill
                    </Button>
                  )}
                </DialogFooter>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-12">
                Failed to load skill details.
              </div>
            )}
          </div>
        ) : (
          /* Search View */
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search skills (e.g. nutrition, react, database)..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-8 h-9 text-sm"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-1">
                {results.map((skill) => {
                  const isInstalled = installedKeys.has(skill.skillId);
                  const isImporting = importing === skill.skillId;
                  return (
                    <div
                      key={skill.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => viewDetail(skill)}
                    >
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {skill.name || skill.skillId}
                          </span>
                          {isInstalled && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                            >
                              <Check className="h-2.5 w-2.5 mr-0.5" />
                              Installed
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            {skill.source}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            <Download className="h-2.5 w-2.5 inline mr-0.5" />
                            {formatInstalls(skill.installs)}
                          </span>
                        </div>
                      </div>
                      {!isInstalled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isImporting}
                          onClick={(e) => {
                            e.stopPropagation();
                            importSkill(skill);
                          }}
                        >
                          {isImporting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Import
                            </>
                          )}
                        </Button>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}

                {hasSearched && !searching && results.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No skills found for &quot;{query}&quot;
                  </p>
                )}

                {!hasSearched && !searching && (
                  <div className="text-center py-8 space-y-2">
                    <Package className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Search to discover skills from the registry
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Over 91,000 skills from Anthropic, Vercel, Supabase, and
                      more
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-end pt-1 border-t">
              <a
                href="https://skills.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse all on skills.sh
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Skills Tab ─────────────────────────────────────────────────

export function SkillsTab({ agentId }: SkillsTabProps) {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [registryOpen, setRegistryOpen] = useState(false);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}/skills`);
      const json = await res.json();
      setSkills(json.data || []);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const addCustomSkill = async () => {
    const name = `New Skill ${skills.length + 1}`;
    try {
      const res = await fetch(`/api/agents/${agentId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key: toSlug(name) }),
      });
      if (!res.ok) {
        toast.error("Failed to create");
        return;
      }
      const json = await res.json();
      setSkills((prev) => [...prev, json.data]);
      setExpanded((prev) => new Set(prev).add(json.data.id));
      toast.success("Skill created");
    } catch {
      toast.error("Failed to create");
    }
  };

  const updateSkill = async (
    skillId: string,
    field: string,
    value: unknown
  ) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, [field]: value } : s))
    );
    try {
      const res = await fetch(
        `/api/agents/${agentId}/skills/${skillId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );
      if (!res.ok) toast.error("Failed to save");
    } catch {
      toast.error("Failed to save");
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (!confirm("Delete this skill?")) return;
    try {
      await fetch(`/api/agents/${agentId}/skills/${skillId}`, {
        method: "DELETE",
      });
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      toast.success("Skill deleted");
    } catch {
      toast.error("Failed to delete");
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

  const installedKeys = new Set(skills.map((s) => s.key));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading skills...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Skills</span>
          <span className="text-xs text-muted-foreground ml-1">
            {skills.filter((s) => s.isEnabled).length} of {skills.length}{" "}
            enabled
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Skill
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={addCustomSkill}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Create Custom Skill
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRegistryOpen(true)}>
              <Globe className="h-3.5 w-3.5 mr-2" />
              Import from Registry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Skills list */}
      <div className="space-y-2">
        {skills.map((skill) => {
          const isExpanded = expanded.has(skill.id);
          return (
            <div
              key={skill.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {/* Collapsed row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => toggleExpand(skill.id)}
              >
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {skill.key}
                    </span>
                    {skill.category && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${SKILL_CATEGORY_COLORS[skill.category] || ""}`}
                      >
                        {skill.category}
                      </Badge>
                    )}
                  </div>
                  {skill.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {skill.description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={skill.isEnabled}
                  onCheckedChange={(val) => {
                    updateSkill(skill.id, "isEnabled", val);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input
                        value={skill.name}
                        onChange={(e) =>
                          setSkills((prev) =>
                            prev.map((s) =>
                              s.id === skill.id
                                ? { ...s, name: e.target.value }
                                : s
                            )
                          )
                        }
                        onBlur={() =>
                          updateSkill(skill.id, "name", skill.name)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key</Label>
                      <Input
                        value={skill.key}
                        onChange={(e) =>
                          setSkills((prev) =>
                            prev.map((s) =>
                              s.id === skill.id
                                ? { ...s, key: e.target.value }
                                : s
                            )
                          )
                        }
                        onBlur={() => updateSkill(skill.id, "key", skill.key)}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      value={skill.description || ""}
                      onChange={(e) =>
                        setSkills((prev) =>
                          prev.map((s) =>
                            s.id === skill.id
                              ? { ...s, description: e.target.value }
                              : s
                          )
                        )
                      }
                      onBlur={() =>
                        updateSkill(
                          skill.id,
                          "description",
                          skill.description
                        )
                      }
                      placeholder="What does this skill enable the agent to do?"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Prompt Fragment</Label>
                      <span className="text-[10px] text-muted-foreground">
                        {(skill.promptFragment || "").length} chars
                      </span>
                    </div>
                    <Textarea
                      value={skill.promptFragment || ""}
                      onChange={(e) =>
                        setSkills((prev) =>
                          prev.map((s) =>
                            s.id === skill.id
                              ? { ...s, promptFragment: e.target.value }
                              : s
                          )
                        )
                      }
                      onBlur={() =>
                        updateSkill(
                          skill.id,
                          "promptFragment",
                          skill.promptFragment
                        )
                      }
                      placeholder="Text appended to system prompt when this skill is active..."
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      This text is appended to the agent&apos;s system prompt
                      when the skill is enabled.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Input
                      value={skill.category || ""}
                      onChange={(e) =>
                        setSkills((prev) =>
                          prev.map((s) =>
                            s.id === skill.id
                              ? { ...s, category: e.target.value }
                              : s
                          )
                        )
                      }
                      onBlur={() =>
                        updateSkill(skill.id, "category", skill.category)
                      }
                      placeholder="core, advanced, experimental, imported"
                      className="max-w-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteSkill(skill.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete Skill
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {skills.length === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/10 text-center py-12 space-y-3">
            <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground">
                No skills configured yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Create a custom skill or import one from the skills registry
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={addCustomSkill}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Custom
              </Button>
              <Button size="sm" onClick={() => setRegistryOpen(true)}>
                <Globe className="h-3.5 w-3.5 mr-1" />
                Import from Registry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Registry modal */}
      <SkillsRegistryModal
        open={registryOpen}
        onOpenChange={setRegistryOpen}
        agentId={agentId}
        installedKeys={installedKeys}
        onInstalled={() => {
          fetchSkills();
        }}
      />
    </div>
  );
}
