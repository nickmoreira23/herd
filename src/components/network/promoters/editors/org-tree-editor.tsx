"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User, UserCog, Crown } from "lucide-react";
import { toast } from "sonner";

interface OrgNodeData {
  id: string;
  name: string;
  roleType: string;
  parentId: string | null;
  email: string | null;
  isActive: boolean;
}

interface OrgTreeEditorProps {
  partnerId: string;
  nodes: OrgNodeData[];
  onRefresh: () => void;
}

const ROLE_ICONS: Record<string, React.ElementType> = { REGIONAL_LEADER: Crown, TEAM_LEAD: UserCog, REP: User };
const ROLE_LABELS: Record<string, string> = { REGIONAL_LEADER: "Regional Leader", TEAM_LEAD: "Team Lead", REP: "Rep" };
const ROLE_COLORS: Record<string, string> = {
  REGIONAL_LEADER: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  TEAM_LEAD: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  REP: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function OrgTreeEditor({ partnerId, nodes, onRefresh }: OrgTreeEditorProps) {
  const [adding, setAdding] = useState<{ parentId: string | null; roleType: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Build tree structure
  const roots = nodes.filter(n => !n.parentId);
  const childrenOf = (parentId: string) => nodes.filter(n => n.parentId === parentId);

  async function handleAdd() {
    if (!newName.trim() || !adding) return;
    const res = await fetch(`/api/d2d-partners/${partnerId}/org-nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, roleType: adding.roleType, parentId: adding.parentId, email: newEmail || undefined }),
    });
    if (!res.ok) { toast.error("Failed to add"); return; }
    toast.success("Added");
    setAdding(null);
    setNewName("");
    setNewEmail("");
    onRefresh();
  }

  async function handleDelete(nodeId: string, name: string) {
    if (!confirm(`Remove "${name}" and all their reports?`)) return;
    await fetch(`/api/d2d-partners/${partnerId}/org-nodes/${nodeId}`, { method: "DELETE" });
    toast.success("Removed");
    onRefresh();
  }

  function renderNode(node: OrgNodeData, depth: number) {
    const Icon = ROLE_ICONS[node.roleType] || User;
    const children = childrenOf(node.id);

    return (
      <div key={node.id} style={{ marginLeft: depth * 24 }} className="relative">
        {depth > 0 && (
          <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-border" />
        )}
        <div className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group ${!node.isActive ? "opacity-50" : ""}`}>
          {depth > 0 && <div className="absolute left-[-16px] top-[14px] w-3 h-px bg-border" />}
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium">{node.name}</span>
          <Badge className={`text-[9px] px-1 py-0 ${ROLE_COLORS[node.roleType]}`}>{ROLE_LABELS[node.roleType]}</Badge>
          {node.email && <span className="text-[10px] text-muted-foreground">{node.email}</span>}
          <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.roleType !== "REP" && (
              <Button variant="ghost" size="icon-sm" title="Add report" onClick={() => {
                const childRole = node.roleType === "REGIONAL_LEADER" ? "TEAM_LEAD" : "REP";
                setAdding({ parentId: node.id, roleType: childRole });
              }}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" title="Remove" onClick={() => handleDelete(node.id, node.name)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roots.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">No org nodes yet. Add a Regional Leader to start.</p>
      )}
      {roots.map(r => renderNode(r, 0))}

      {/* Add button or inline form */}
      {adding ? (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border bg-muted/20">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="h-7 text-xs flex-1" autoFocus />
          <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email (optional)" className="h-7 text-xs flex-1" />
          <Badge className={`text-[9px] px-1.5 py-0 ${ROLE_COLORS[adding.roleType]}`}>{ROLE_LABELS[adding.roleType]}</Badge>
          <Button size="xs" onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
          <Button size="xs" variant="ghost" onClick={() => { setAdding(null); setNewName(""); setNewEmail(""); }}>Cancel</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setAdding({ parentId: null, roleType: "REGIONAL_LEADER" })}>
          <Plus className="h-3 w-3 mr-1" />
          Add Regional Leader
        </Button>
      )}
    </div>
  );
}
