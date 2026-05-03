"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Bot,
  Gem,
  Handshake,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Blocks,
  Boxes,
  Gift,
  Users,
  CreditCard,
  Flag,
  Network,
  ShoppingBag,
  Megaphone,
  Star,
  Link2,
  Store,
  Crown,
  BookOpen,
  User,
  ChevronsUpDown,
  Pin,
  Plug,
  Sun,
  Moon,
  Lightbulb,
  Scale,
  Target,
  Dumbbell,
  Apple,
  MessageSquare,
  Receipt,
  Brain,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { hrefToSubPanel, getSubPanelIdForPath } from "@/components/layout/sub-panel";
import { LocaleSelector } from "@/components/i18n/locale-selector";
import { useT } from "@/lib/i18n/locale-context";
import type { MessageKey } from "@/lib/i18n/t";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Nav item types ──────────────────────────────────────────────────

interface NavLink {
  type: "link";
  href: string;
  label: string;
  labelKey?: MessageKey;
  icon: LucideIcon;
}

interface NavGroup {
  type: "group";
  label: string;
  labelKey?: MessageKey;
  icon: LucideIcon;
  children: NavLink[];
}

type NavItem = NavLink | NavGroup;

// ─── Navigation config ──────────────────────────────────────────────

const navItems: NavItem[] = [
  { type: "link", href: "/admin", label: "Dashboard", labelKey: "nav.sidebar.dashboard", icon: LayoutDashboard },
  { type: "link", href: "/admin/chat", label: "Chat", labelKey: "nav.sidebar.chat", icon: MessageSquare },
  { type: "link", href: "/admin/organization/profile", label: "Organization", labelKey: "nav.sidebar.organization", icon: Building2 },
  { type: "link", href: "/admin/knowledge", label: "Knowledge", labelKey: "nav.sidebar.knowledge", icon: Brain },
  { type: "link", href: "/admin/handbook", label: "Handbook", labelKey: "nav.sidebar.handbook", icon: BookOpen },
  { type: "link", href: "/admin/network", label: "Network", labelKey: "nav.sidebar.network", icon: Network },
  { type: "link", href: "/admin/marketplace", label: "Marketplace", labelKey: "nav.sidebar.marketplace", icon: ShoppingBag },
  { type: "link", href: "/admin/ledger", label: "Ledger", labelKey: "nav.sidebar.ledger", icon: Receipt },
  { type: "link", href: "/admin/agents", label: "Agents", labelKey: "nav.sidebar.agents", icon: Bot },
  { type: "link", href: "/admin/areas", label: "Areas", labelKey: "nav.sidebar.areas", icon: Layers },
  { type: "link", href: "/admin/tools", label: "Tools", labelKey: "nav.sidebar.tools", icon: Lightbulb },
  { type: "link", href: "/admin/blocks", label: "Blocks", labelKey: "nav.sidebar.blocks", icon: Blocks },
  { type: "link", href: "/admin/integrations", label: "Integrations", labelKey: "nav.sidebar.integrations", icon: Plug },
];

// Closed sidebar width: 16px padding + 40px logo/icon + 16px padding
const ICON_COL = 72; // px
const SIDEBAR_WIDTH = 240; // px — expanded sidebar width

// ─── Component ──────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarPinned, toggleSidebarPinned, setSidebarHovered, theme, setSubPanelId, subPanelId } = useUIStore();
  const expanded = useUIStore((s) => s.sidebarExpanded());
  const { data: session } = useSession();
  const t = useT();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Auto-detect sub-panel from current route on mount and route changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const detectedPanel = getSubPanelIdForPath(pathname);
    if (detectedPanel && detectedPanel !== subPanelId) {
      setSubPanelId(detectedPanel);
    } else if (!detectedPanel && subPanelId) {
      // Close sub-panel when navigating away from its routes
      setSubPanelId(null);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, setSubPanelId, subPanelId]);

  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "";
  const userRole = (session?.user as { role?: string } | undefined)?.role || "admin";
  const userImage = session?.user?.image;

  // Fetch company branding
  const [companyName, setCompanyName] = useState("HERD");
  const [companyIconUrl, setCompanyIconUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          const settings = json.data as Record<string, string>;
          if (settings.companyName) setCompanyName(settings.companyName);
          if (settings.companyIconUrl) setCompanyIconUrl(settings.companyIconUrl);
        }
      })
      .catch(() => {});

    const handleBrandUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.companyIconUrl !== undefined) {
        setCompanyIconUrl(detail.companyIconUrl || null);
      }
    };
    window.addEventListener("brand-kit-updated", handleBrandUpdate);
    return () => window.removeEventListener("brand-kit-updated", handleBrandUpdate);
  }, []);

  // Hover handlers — only active when sidebar is unpinned
  const handleMouseEnter = useCallback(() => {
    if (sidebarPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setSidebarHovered(true);
  }, [sidebarPinned, setSidebarHovered]);

  const handleMouseLeave = useCallback(() => {
    if (sidebarPinned) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setSidebarHovered(false);
    }, 200);
  }, [sidebarPinned, setSidebarHovered]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Close profile popover when sidebar state changes
  useEffect(() => {
    setProfileOpen(false);
  }, [expanded]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (pathname.startsWith("/admin/foundations")) initial.add("Foundations");
    return initial;
  });

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    const panelId = hrefToSubPanel[href];
    if (panelId) {
      const detectedPanel = getSubPanelIdForPath(pathname);
      if (detectedPanel === panelId) return true;
    }
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isGroupActive = (group: NavGroup) =>
    group.children.some((child) => isActive(child.href));

  // ─── Render helpers ──────────────────────────────────────────────

  const renderLink = (item: NavLink, indent = false) => {
    const active = isActive(item.href);
    const linkLabel = item.labelKey ? t(item.labelKey) : item.label;

    const handleClick = () => {
      const panelId = hrefToSubPanel[item.href];
      if (panelId) {
        setSubPanelId(panelId);
      } else if (subPanelId) {
        const targetPanel = getSubPanelIdForPath(item.href);
        if (!targetPanel) {
          setSubPanelId(null);
        }
      }
    };

    const content = (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleClick}
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-colors h-10",
          active
            ? "bg-primary/10 text-primary dark:bg-brand/10 dark:text-brand"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        style={{ paddingLeft: indent && expanded ? 28 : 15 }}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0 mr-3" />
        {expanded && <span className="truncate">{linkLabel}</span>}
      </Link>
    );

    if (!expanded) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger className="w-full">{content}</TooltipTrigger>
          <TooltipContent side="right">{linkLabel}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const renderGroup = (group: NavGroup) => {
    const isOpen = openGroups.has(group.label);
    const groupActive = isGroupActive(group);
    const groupLabel = group.labelKey ? t(group.labelKey) : group.label;

    const groupButton = (
      <button
        onClick={() => toggleGroup(group.label)}
        className={cn(
          "flex items-center rounded-md text-sm font-medium transition-colors w-full h-10",
          groupActive
            ? "text-primary dark:text-brand"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        style={{ paddingLeft: 15 }}
      >
        <group.icon className="h-[18px] w-[18px] shrink-0 mr-3" />
        {expanded && (
          <>
            <span className="flex-1 text-left truncate">{groupLabel}</span>
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground mr-3" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mr-3" />
            )}
          </>
        )}
      </button>
    );

    if (!expanded) {
      return (
        <div key={group.label}>
          <Tooltip>
            <TooltipTrigger className="w-full">{groupButton}</TooltipTrigger>
            <TooltipContent side="right">{groupLabel}</TooltipContent>
          </Tooltip>
        </div>
      );
    }

    return (
      <div key={group.label}>
        {groupButton}
        {isOpen && (
          <div>
            {group.children.map((child) => renderLink(child, true))}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-200 ease-in-out h-screen shrink-0",
        sidebarPinned ? "" : "fixed top-0 left-0 z-40",
      )}
      style={{ width: expanded ? SIDEBAR_WIDTH : ICON_COL }}
    >
      {/* Header — Company icon + name + pin */}
      <div className="flex items-center shrink-0 pt-4 pb-4">
        <div className="flex items-center shrink-0 pl-4">
          {companyIconUrl ? (
            <Image
              src={companyIconUrl}
              alt={companyName}
              width={40}
              height={40}
              className="rounded-md object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-primary/10 dark:bg-brand/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary dark:text-brand">
                {companyName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        {expanded && (
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-4 pr-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {companyName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {t("shell.sidebar.administrator")}
              </p>
            </div>
            <button
              onClick={toggleSidebarPinned}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              title={t(sidebarPinned ? "shell.sidebar.unpin" : "shell.sidebar.pin")}
            >
              <Pin className="h-3.5 w-3.5" fill={sidebarPinned ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-0 pb-2 overflow-y-auto overscroll-contain scrollbar-thin space-y-1.5 px-3">
        {navItems.map((item) =>
          item.type === "group" ? renderGroup(item) : renderLink(item)
        )}
      </nav>

      {/* Profile */}
      <div className="shrink-0 border-t border-border">
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger
            className="flex items-center w-full min-h-[56px] transition-colors hover:bg-accent cursor-pointer"
          >
            <div className="flex shrink-0 pl-4 pt-4 pb-4">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={userName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full shrink-0 object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            {expanded && (
              <>
                <div className="flex-1 text-left min-w-0 pl-4">
                  <p className="font-medium truncate text-sm leading-tight">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate capitalize">{userRole}</p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 mr-3" />
              </>
            )}
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-64 p-0"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt={userName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{userRole}</p>
              </div>
            </div>
            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/admin/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                {t("shell.profile.view_profile")}
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t("shell.profile.settings")}
              </Link>
              <div className="border-t border-border my-1" />
              <div className="px-4 py-2">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">
                  {t("shell.profile.appearance")}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const store = useUIStore.getState();
                      store.setTheme("light");
                      fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ themeMode: "light" }),
                      }).catch(() => {});
                    }}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors flex-1 justify-center ${
                      theme === "light"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    {t("shell.profile.theme.light")}
                  </button>
                  <button
                    onClick={() => {
                      const store = useUIStore.getState();
                      store.setTheme("dark");
                      fetch("/api/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ themeMode: "dark" }),
                      }).catch(() => {});
                    }}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors flex-1 justify-center ${
                      theme === "dark"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground/20"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    {t("shell.profile.theme.dark")}
                  </button>
                </div>
              </div>
              <div className="border-t border-border my-1" />
              <LocaleSelector />
              <div className="border-t border-border my-1" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                {t("shell.profile.logout")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>
  );
}
