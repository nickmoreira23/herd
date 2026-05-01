"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User, UserCog, Crown } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

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
const ROLE_LABEL_KEYS: Record<string, MessageKey> = {
  REGIONAL_LEADER: "network.promoters.org_tree.editor.role.regional_leader",
  TEAM_LEAD: "network.promoters.org_tree.editor.role.team_lead",
  REP: "network.promoters.org_tree.editor.role.rep",
};
const ROLE_COLORS: Record<string, string> = {
  REGIONAL_LEADER: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  TEAM_LEAD: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  REP: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function OrgTreeEditor({ partnerId, nodes, onRefresh }: OrgTreeEditorProps) {
  const t = useT();
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
    if (!res.ok) { notifyError("error.network.promoters.org_tree.add_failed", t); return; }
    notifySuccess("network.promoters.org_tree.editor.feedback.added", t);
    setAdding(null);
    setNewName("");
    setNewEmail("");
    onRefresh();
  }

  async function handleDelete(nodeId: string, name: string) {
    if (!confirm(t("network.promoters.org_tree.editor.confirm_delete", { name }))) return;
    await fetch(`/api/d2d-partners/${partnerId}/org-nodes/${nodeId}`, { method: "DELETE" });
    notifySuccess("network.promoters.org_tree.editor.feedback.removed", t);
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
          <Badge className={`text-[9px] px-1 py-0 ${ROLE_COLORS[node.roleType]}`}>{t(ROLE_LABEL_KEYS[node.roleType])}</Badge>
          {node.email && <span className="text-[10px] text-muted-foreground">{node.email}</span>}
          <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.roleType !== "REP" && (
              <Button variant="ghost" size="icon-sm" title={t("network.promoters.org_tree.editor.title.add_report")} onClick={() => {
                const childRole = node.roleType === "REGIONAL_LEADER" ? "TEAM_LEAD" : "REP";
                setAdding({ parentId: node.id, roleType: childRole });
              }}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" title={t("network.promoters.org_tree.editor.title.remove")} onClick={() => handleDelete(node.id, node.name)}>
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
        <p className="text-xs text-muted-foreground py-2">{t("network.promoters.org_tree.editor.empty")}</p>
      )}
      {roots.map(r => renderNode(r, 0))}

      {/* Add button or inline form */}
      {adding ? (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border bg-muted/20">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("network.promoters.org_tree.editor.placeholder.name")} className="h-7 text-xs flex-1" autoFocus />
          <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={t("network.promoters.org_tree.editor.placeholder.email")} className="h-7 text-xs flex-1" />
          <Badge className={`text-[9px] px-1.5 py-0 ${ROLE_COLORS[adding.roleType]}`}>{t(ROLE_LABEL_KEYS[adding.roleType])}</Badge>
          <Button size="xs" onClick={handleAdd} disabled={!newName.trim()}>{t("network.promoters.org_tree.editor.action.add")}</Button>
          <Button size="xs" variant="ghost" onClick={() => { setAdding(null); setNewName(""); setNewEmail(""); }}>{t("network.promoters.org_tree.editor.action.cancel")}</Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setAdding({ parentId: null, roleType: "REGIONAL_LEADER" })}>
          <Plus className="h-3 w-3 mr-1" />
          {t("network.promoters.org_tree.editor.action.add_regional_leader")}
        </Button>
      )}
    </div>
  );
}
