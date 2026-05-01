"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, GitBranch, Share2, PanelLeftClose, Settings2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useT } from "@/lib/i18n/locale-context";
import { hexToRgba } from "@/lib/blocks/block-categories";
import { ManageNetworkDialog } from "@/components/network/manage-network-dialog";
import { SUB_PANEL_WIDTH } from "@/components/layout/sub-panel-types";

interface NetworkSidebarDepartment {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface NetworkSidebarChannel {
  id: string;
  slug: string;
  displayName: string;
  color: string | null;
  icon: string | null;
}

interface NetworkSidebarData {
  departments: NetworkSidebarDepartment[];
  channels: NetworkSidebarChannel[];
}

export function NetworkSubPanel() {
  const pathname = usePathname();
  const { setSubPanelCollapsed } = useUIStore();
  const t = useT();
  const [data, setData] = useState<NetworkSidebarData>({
    departments: [],
    channels: [],
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = () => {
    fetch("/api/network/sidebar")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setData(j.data as NetworkSidebarData);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    const onUpdated = () => refresh();
    window.addEventListener("network-sidebar-updated", onUpdated);
    return () => window.removeEventListener("network-sidebar-updated", onUpdated);
  }, []);

  const isExact = (href: string) => pathname === href;
  const isPrefix = (href: string) => pathname.startsWith(href);

  const renderTopLink = (href: string, label: string, Icon: LucideIcon) => {
    const active = isExact(href);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <div
      className="shrink-0 flex flex-col border-r border-border bg-card h-screen transition-all duration-200 ease-in-out"
      style={{ width: SUB_PANEL_WIDTH }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h2 className="text-[16px] font-semibold truncate pl-6">
          {t("network.subpanel.title")}
        </h2>
        <button
          onClick={() => setSubPanelCollapsed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-accent mr-4"
          title={t("nav.subpanel.collapse")}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Links */}
      <nav className="flex-1 pb-4 overflow-y-auto px-3">
        {renderTopLink("/admin/network", t("network.subpanel.all_members"), LayoutGrid)}
        {renderTopLink("/admin/organization/org-chart", t("network.subpanel.org_chart"), GitBranch)}
        {renderTopLink("/admin/organization/network-map", t("network.subpanel.network_map"), Share2)}

        {/* Internal Network — departments */}
        <div className="mt-4">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("network.subpanel.internal")}
          </p>
          {data.departments.length === 0 ? (
            <p className="px-3 py-1 text-xs text-muted-foreground italic">
              {t("network.subpanel.no_departments")}
            </p>
          ) : (
            data.departments.map((d) => {
              const href = `/admin/network/departments/${d.slug}`;
              const active = isPrefix(href);
              return (
                <Link
                  key={d.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <span
                    className="size-3.5 shrink-0 rounded-full border-2"
                    style={{
                      borderColor: "#94a3b8",
                      backgroundColor: hexToRgba("#94a3b8", 0.25),
                    }}
                  />
                  <span className="truncate">{d.name}</span>
                </Link>
              );
            })
          )}
        </div>

        {/* External Network — channels */}
        <div className="mt-4">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("network.subpanel.external")}
          </p>
          {data.channels.length === 0 ? (
            <p className="px-3 py-1 text-xs text-muted-foreground italic">
              {t("network.subpanel.no_channels")}
            </p>
          ) : (
            data.channels.map((c) => {
              const href = `/admin/network/channels/${c.slug}`;
              const active = isPrefix(href);
              const color = c.color || "#f59e0b";
              return (
                <Link
                  key={c.id}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? ""
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  style={
                    active
                      ? { backgroundColor: hexToRgba(color, 0.1), color }
                      : undefined
                  }
                >
                  <span
                    className="size-3.5 shrink-0 rounded-full border-2"
                    style={{
                      borderColor: color,
                      backgroundColor: hexToRgba(color, 0.25),
                    }}
                  />
                  <span className="truncate">{c.displayName}</span>
                </Link>
              );
            })
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2">
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full"
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span>{t("network.subpanel.manage")}</span>
        </button>
      </div>

      <ManageNetworkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onChange={refresh}
      />
    </div>
  );
}
