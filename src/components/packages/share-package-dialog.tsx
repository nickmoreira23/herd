"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Link2,
  Copy,
  Check,
  Trash2,
  Eye,
  Pencil,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface ShareLink {
  id: string;
  token: string;
  permission: string;
  createdAt: string;
  isActive: boolean;
}

interface SharePackageDialogProps {
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePackageDialog({
  packageId,
  open,
  onOpenChange,
}: SharePackageDialogProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${packageId}/share`);
      if (res.ok) {
        const json = await res.json();
        setLinks(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    if (open) fetchLinks();
  }, [open, fetchLinks]);

  async function createLink(permission: "view" | "edit") {
    setCreating(true);
    try {
      const res = await fetch(`/api/packages/${packageId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to create link");
      }
      await fetchLinks();
      toast.success(`${permission === "edit" ? "Edit" : "View"} link created`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create link"
      );
    } finally {
      setCreating(false);
    }
  }

  async function revokeLink(linkId: string) {
    try {
      const res = await fetch(
        `/api/packages/${packageId}/share?linkId=${linkId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to revoke");
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      toast.success("Link revoked");
    } catch {
      toast.error("Failed to revoke link");
    }
  }

  function copyLink(token: string, linkId: string) {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Share Package
          </DialogTitle>
          <DialogDescription>
            Create public links to share this package. Choose whether recipients
            can only view or also edit the package.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLink("view")}
              disabled={creating}
              className="flex-1 gap-1.5"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Create View Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createLink("edit")}
              disabled={creating}
              className="flex-1 gap-1.5"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
              Create Edit Link
            </Button>
          </div>

          {/* Links list */}
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No active share links. Create one above.
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => {
                const isCopied = copiedId === link.id;
                const url = `${typeof window !== "undefined" ? window.location.origin : ""}/shared/${link.token}`;

                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20"
                  >
                    <Badge
                      variant="secondary"
                      className={
                        link.permission === "edit"
                          ? "bg-emerald-100 text-emerald-700 gap-1 shrink-0"
                          : "bg-zinc-100 text-zinc-700 gap-1 shrink-0"
                      }
                    >
                      {link.permission === "edit" ? (
                        <Pencil className="h-2.5 w-2.5" />
                      ) : (
                        <Eye className="h-2.5 w-2.5" />
                      )}
                      {link.permission}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        {url}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Created{" "}
                        {new Date(link.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copyLink(link.token, link.id)}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                      onClick={() => revokeLink(link.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
