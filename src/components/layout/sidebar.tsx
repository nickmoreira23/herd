"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  ChevronsUpDown,
  Pin,
  Sun,
  Moon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { hrefToSubPanel, getSubPanelIdForPath } from "@/components/layout/sub-panel";
import { LocaleSelector } from "@/components/i18n/locale-selector";
import { useT } from "@/lib/i18n/locale-context";
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
import { ProfileViewSelector } from "@/components/sidebar/profile-view-selector";
import { useProfileView } from "@/lib/core/profile-view/hook";
import {
  buildNavForView,
  type NavGroup,
  type NavItem,
  type NavLink,
} from "@/components/sidebar/nav-config";
import { filterNavByAccess } from "@/components/sidebar/filter-nav";
import type { MemberRole } from "@prisma/client";

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
  const { view: profileView } = useProfileView();
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
  const userImage = session?.user?.image;

  // Host-aware org role (Sub-24 polish): /api/org/current returns the viewer's
  // ORG-scoped role for the current host's org. Falls back to the host-blind
  // JWT role, then "admin" (super_admin without membership lands here).
  const [orgRole, setOrgRole] = useState<string | null>(null);
  // Sub-27c: distinguishes "loading" (orgLoaded false → nav fail-open, shows
  // gated items) from "loaded non-member" (orgLoaded true + orgRole null → hide).
  const [orgLoaded, setOrgLoaded] = useState(false);
  const userRole =
    orgRole ??
    (session?.user as { role?: string } | undefined)?.role ??
    "admin";
  // Display-only capitalization: enum roles arrive ALL-CAPS (OWNER/ADMIN/MEMBER)
  // or snake_case (super_admin). Render "Owner"/"Admin"/"Member"/"Super Admin"
  // without mutating the underlying enum value.
  const roleLabel = userRole
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

  // Fetch company branding — Sub-etapa 23: /api/org/current is primary (host-aware).
  // /api/settings companyIconUrl is preserved as branding fallback.
  const [companyName, setCompanyName] = useState("ComeçaAI");
  const [companyIconUrl, setCompanyIconUrl] = useState<string | null>(null);

  // Org switcher — Sub-etapa 22.2: fetch memberships; show switcher when 2+ orgs.
  const [memberships, setMemberships] = useState<
    { orgId: string; name: string; subdomain: string }[]
  >([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  async function handleOrgSwitch(orgId: string) {
    setSwitching(orgId);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      const body = await res.json();
      if (res.ok && body.data?.redirectUrl) {
        window.location.href = body.data.redirectUrl;
      }
    } catch {
      // silent fail — user can retry
    } finally {
      setSwitching(null);
      setSwitcherOpen(false);
    }
  }

  useEffect(() => {
    // Primary: resolve org name from current host via proxy x-org-id header
    fetch("/api/org/current")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.name) setCompanyName(json.data.name);
        // role may be absent (non-member) — store null so the nav gate can make
        // a definitive decision; orgLoaded marks the load complete.
        setOrgRole(json.data?.role ?? null);
        setOrgLoaded(true);
      })
      .catch(() => {
        // fail-open: on error leave orgLoaded false → gated items stay visible.
      });

    // Org memberships — drive the switcher dropdown visibility and options.
    fetch("/api/auth/memberships")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data)) setMemberships(json.data);
      })
      .catch(() => {});

    // Secondary: platform-wide icon/brand from settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          const settings = json.data as Record<string, string>;
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

    const isSquare = !!item.squareColor;

    const iconNode = isSquare ? (
      <span
        className={cn(
          "h-10 w-10 shrink-0 flex items-center justify-center rounded-[8px] border-[1.5px] transition-colors",
          "group-hover:bg-accent",
          active
            ? "border-foreground"
            : "border-border group-hover:border-foreground",
        )}
        aria-hidden
      >
        <item.icon className="h-[18px] w-[18px]" style={{ color: item.squareColor }} />
      </span>
    ) : (
      <span className="h-10 w-10 shrink-0 flex items-center justify-center">
        <item.icon className="h-[18px] w-[18px]" />
      </span>
    );

    const content = (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleClick}
        className={cn(
          "group relative flex items-center text-sm h-10",
          active
            ? "text-foreground font-semibold"
            : "text-muted-foreground font-medium",
        )}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-foreground"
          />
        )}
        {!isSquare && (
          <span
            aria-hidden
            className="absolute inset-y-0 left-4 right-4 rounded-md transition-colors group-hover:bg-accent"
          />
        )}
        <span
          className={cn(
            "relative flex items-center pl-4 pr-4 min-w-0",
            isSquare ? "gap-3" : "gap-4",
          )}
        >
          {iconNode}
          {expanded && (
            <span className={cn("truncate transition-colors", "group-hover:text-foreground")}>
              {linkLabel}
            </span>
          )}
        </span>
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
    const groupLabel = group.label;

    const groupButton = (
      <button
        onClick={() => toggleGroup(group.label)}
        className={cn(
          "group relative flex items-center text-sm w-full h-10",
          groupActive
            ? "text-foreground font-semibold"
            : "text-muted-foreground font-medium",
        )}
      >
        {groupActive && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-foreground"
          />
        )}
        <span
          className={cn(
            "absolute inset-y-0 left-4 right-4 rounded-md transition-colors",
            !groupActive && "group-hover:bg-accent",
          )}
          aria-hidden
        />
        <span className="relative flex items-center pl-4 pr-4 gap-3 min-w-0 w-full">
          <span className="h-10 w-10 shrink-0 flex items-center justify-center">
            <group.icon className="h-[18px] w-[18px]" />
          </span>
          {expanded && (
            <>
              <span className="flex-1 text-left truncate">{groupLabel}</span>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </>
          )}
        </span>
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
              width={39}
              height={39}
              className="rounded-md object-contain"
            />
          ) : (
            <div className="h-[39px] w-[39px] rounded-md bg-primary/10 dark:bg-brand/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary dark:text-brand">
                {companyName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        {expanded && (
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-4 pr-4">
            <div className="flex-1 min-w-0">
              {memberships.length >= 2 ? (
                <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
                  <PopoverTrigger className="flex items-center gap-1 text-sm font-semibold leading-tight truncate hover:text-foreground/80 transition-colors">
                    <span className="truncate">{companyName}</span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1" align="start">
                    {memberships.map((m) => (
                      <button
                        key={m.orgId}
                        onClick={() => handleOrgSwitch(m.orgId)}
                        disabled={switching !== null}
                        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.subdomain}</p>
                        </div>
                        {switching === m.orgId && (
                          <span className="text-xs text-muted-foreground ml-2">…</span>
                        )}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : (
                <p className="text-sm font-semibold truncate leading-tight">
                  {companyName}
                </p>
              )}
              <div className="mt-0.5">
                <ProfileViewSelector />
              </div>
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

      {/* Navigation — top / middle / bottom sections */}
      {(() => {
        // Sub-27c: hide nav items the viewer cannot access (UX mirror of the
        // server guards #143/#144). Fail-open while orgRole is still loading.
        const nav = filterNavByAccess(buildNavForView(profileView), {
          orgRole: orgLoaded ? (orgRole as MemberRole | null) : undefined,
          isSuperAdmin: Boolean(
            (session?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin,
          ),
        });
        const middle = nav.middle;
        const renderItem = (item: NavItem) =>
          item.type === "group" ? renderGroup(item) : renderLink(item);
        const middleHasItems = !!middle && middle.items.length > 0;
        const MiddleIcon = middle?.icon;
        return (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top */}
            {nav.top.length > 0 && (
              <nav className="shrink-0 pt-2 pb-4 space-y-2">
                {nav.top.map(renderItem)}
              </nav>
            )}

            {/* Middle (scrollable) — shown only when section has items */}
            {middleHasItems && middle && MiddleIcon && (
              <>
                <div className="shrink-0 mx-4 border-t border-border" />
                <div className="shrink-0 pt-4">
                  <div className="relative flex items-center text-sm font-medium h-10 text-muted-foreground">
                    <span className="flex items-center pl-4 pr-4 gap-3 min-w-0 w-full">
                      <span className="h-10 w-10 shrink-0 flex items-center justify-center">
                        <MiddleIcon className="h-[18px] w-[18px]" />
                      </span>
                      {expanded && <span className="truncate">{middle.labelKey ? t(middle.labelKey) : middle.label}</span>}
                    </span>
                  </div>
                </div>
                <nav className="min-h-0 overflow-y-auto overscroll-contain scrollbar-thin space-y-3 pt-3 pb-4 shrink">
                  {middle.items.map(renderItem)}
                </nav>
              </>
            )}

            {/* Flexible spacer — absorbs empty space, keeps bottom divider+nav glued to bottom */}
            <div className="flex-1 min-h-0" />

            {/* Bottom */}
            {nav.bottom.length > 0 && (
              <>
                <div className="shrink-0 mx-4 border-t border-border" />
                <nav className="shrink-0 pt-4 pb-2 space-y-2">
                  {nav.bottom.map(renderItem)}
                </nav>
              </>
            )}
          </div>
        );
      })()}

      {/* Profile */}
      <div className="shrink-0">
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
                  <p className="text-[11px] text-muted-foreground truncate">{roleLabel}</p>
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
                <p className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{roleLabel}</p>
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
