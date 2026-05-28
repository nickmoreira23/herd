import {
  Home,
  MessageSquare,
  Brain,
  Compass,
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Bot,
  Bell,
  LifeBuoy,
  BookOpen,
  Plug,
  Blocks as BlocksIcon,
  LayoutGrid,
  KanbanSquare,
  Dumbbell,
  Apple,
  Droplet,
  Moon,
  HeartPulse,
  DollarSign,
  Folder,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getAllToolCategories } from "@/lib/tools/registry";
import {
  CATEGORY_ICON_MAP,
  TOOL_ICON_MAP,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/tools/category-meta";
import type { ProfileView } from "@/lib/core/profile-view/types";

export interface NavLink {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  /** When set, render a colored square in the icon slot instead of the LucideIcon. */
  squareColor?: string;
}

export interface NavGroup {
  type: "group";
  label: string;
  icon: LucideIcon;
  children: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export interface MiddleSection {
  /** Section title shown as a heading row (e.g., "Work", "Workflow", "Tools"). */
  label: string;
  /** Icon shown in the heading row, same hierarchy as top items. */
  icon: LucideIcon;
  items: NavItem[];
}

export interface ProfileNav {
  top: NavItem[];
  middle: MiddleSection | null;
  bottom: NavItem[];
}

function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return DEFAULT_CATEGORY_ICON;
  return CATEGORY_ICON_MAP[name] ?? TOOL_ICON_MAP[name] ?? DEFAULT_CATEGORY_ICON;
}

function categoryToSquareLink(
  name: string,
  displayName: string,
  icon: string | undefined,
  color: string | undefined,
): NavLink {
  return {
    type: "link",
    href: `/admin/tools/${name}`,
    label: displayName,
    icon: resolveIcon(icon),
    squareColor: color,
  };
}

// Explicit display order for tool categories in the middle section.
const CATEGORY_ORDER = ["legal", "marketing", "sales", "operations", "finances"] as const;

function orderedCategories() {
  const all = getAllToolCategories();
  const result = [];
  for (const name of CATEGORY_ORDER) {
    const cat = all.find((c) => c.name === name);
    if (cat) result.push(cat);
  }
  return result;
}

export function buildNavForView(view: ProfileView): ProfileNav {
  const allCategories = orderedCategories();

  if (view === "member") {
    const SPACE_SQUARE = "#6b7280";
    const spaces: NavItem[] = [
      { type: "link", href: "/admin/spaces/exercise", label: "Exercise", icon: Dumbbell, squareColor: SPACE_SQUARE },
      { type: "link", href: "/admin/spaces/nutrition", label: "Nutrition", icon: Apple, squareColor: SPACE_SQUARE },
      { type: "link", href: "/admin/spaces/hydration", label: "Hydration", icon: Droplet, squareColor: SPACE_SQUARE },
      { type: "link", href: "/admin/spaces/sleep", label: "Sleep", icon: Moon, squareColor: SPACE_SQUARE },
      { type: "link", href: "/admin/spaces/recovery", label: "Recovery", icon: HeartPulse, squareColor: SPACE_SQUARE },
    ];

    return {
      top: [
        { type: "link", href: "/admin/home", label: "Home", icon: Home },
        { type: "link", href: "/admin/chat", label: "Chat", icon: MessageSquare },
        { type: "link", href: "/admin/learn", label: "Learn", icon: GraduationCap },
        { type: "link", href: "/admin/marketplace", label: "Explore", icon: Compass },
      ],
      middle: { label: "Fitness Spaces", icon: LayoutGrid, items: spaces },
      bottom: [
        { type: "link", href: "/admin/notifications", label: "Notifications", icon: Bell },
        { type: "link", href: "/admin/memories", label: "Memories", icon: Brain },
        { type: "link", href: "/admin/help", label: "Help Center", icon: LifeBuoy },
      ],
    };
  }

  if (view === "reseller") {
    const marketing = allCategories.find((c) => c.name === "marketing");
    const sales = allCategories.find((c) => c.name === "sales");
    const middleItems: NavItem[] = [];
    if (marketing) middleItems.push(categoryToSquareLink(marketing.name, marketing.displayName, marketing.icon, marketing.color));
    if (sales) middleItems.push(categoryToSquareLink(sales.name, sales.displayName, sales.icon, sales.color));

    return {
      top: [
        { type: "link", href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { type: "link", href: "/admin/chat", label: "Chat", icon: MessageSquare },
        { type: "link", href: "/admin/knowledge", label: "Organize", icon: Folder },
        { type: "link", href: "/admin/marketplace", label: "Sell", icon: ShoppingBag },
        { type: "link", href: "/admin/earnings", label: "Earn", icon: DollarSign },
      ],
      middle: { label: "Work", icon: LayoutGrid, items: middleItems },
      bottom: [
        { type: "link", href: "/admin/notifications", label: "Notifications", icon: Bell },
        { type: "link", href: "/admin/memories", label: "Memories", icon: Brain },
        { type: "link", href: "/admin/roadmap", label: "Roadmap", icon: KanbanSquare },
        { type: "link", href: "/admin/help", label: "Help Center", icon: LifeBuoy },
      ],
    };
  }

  if (view === "organization") {
    return {
      top: [
        { type: "link", href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { type: "link", href: "/admin/chat", label: "Chat", icon: MessageSquare },
        { type: "link", href: "/admin/organization/members", label: "Members", icon: Users },
        { type: "link", href: "/admin/knowledge", label: "Knowledge", icon: Brain },
        { type: "link", href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
      ],
      middle: {
        label: "Workflow",
        icon: LayoutGrid,
        items: allCategories.map((c) => categoryToSquareLink(c.name, c.displayName, c.icon, c.color)),
      },
      bottom: [
        { type: "link", href: "/admin/blocks", label: "Blocks", icon: BlocksIcon },
        { type: "link", href: "/admin/integrations", label: "Integrations", icon: Plug },
        { type: "link", href: "/admin/roadmap", label: "Roadmap", icon: KanbanSquare },
        { type: "link", href: "/admin/help", label: "Help Center", icon: LifeBuoy },
      ],
    };
  }

  // orchestrator
  return {
    top: [
      { type: "link", href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { type: "link", href: "/admin/chat", label: "Chat", icon: MessageSquare },
      { type: "link", href: "/admin/agents", label: "Agents", icon: Bot },
      { type: "link", href: "/admin/knowledge", label: "Knowledge", icon: Brain },
      { type: "link", href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
      { type: "link", href: "/admin/ledger", label: "Ledger", icon: Receipt },
    ],
    middle: {
      label: "Tools",
      icon: LayoutGrid,
      items: allCategories.map((c) => categoryToSquareLink(c.name, c.displayName, c.icon, c.color)),
    },
    bottom: [
      { type: "link", href: "/admin/blocks", label: "Blocks", icon: BlocksIcon },
      { type: "link", href: "/admin/integrations", label: "Integrations", icon: Plug },
      { type: "link", href: "/admin/roadmap", label: "Roadmap", icon: KanbanSquare },
      { type: "link", href: "/admin/handbook", label: "Handbook", icon: BookOpen },
      { type: "link", href: "/admin/help", label: "Help Center", icon: LifeBuoy },
    ],
  };
}
