import type { LucideIcon } from "lucide-react";
import {
  Package,
  Bot,
  Handshake,
  Gift,
  Users,
  LayoutGrid,
  Video,
  Calendar,
  CheckSquare,
  BookOpen,
  FileText,
  Image,
  Music,
  Table2,
  ClipboardList,
  Link2,
  Rss,
  Plug,
  MessageSquare,
} from "lucide-react";

/** Block name → Lucide icon component */
export const BLOCK_ICON_MAP: Record<string, LucideIcon> = {
  products: Package,
  agents: Bot,
  partners: Handshake,
  perks: Gift,
  community: Users,
  pages: LayoutGrid,
  meetings: Video,
  events: Calendar,
  tasks: CheckSquare,
  knowledge: BookOpen,
  // Knowledge-type blocks (first-class)
  documents: FileText,
  images: Image,
  videos: Video,
  audios: Music,
  tables: Table2,
  forms: ClipboardList,
  links: Link2,
  feeds: Rss,
  apps: Plug,
  // Operations blocks
  messages: MessageSquare,
};

/** Block name → short display label for UI */
export const BLOCK_LABEL_MAP: Record<string, string> = {
  products: "Products",
  agents: "Agents",
  partners: "Partners",
  perks: "Perks",
  community: "Community",
  pages: "Pages",
  meetings: "Meetings",
  events: "Events",
  tasks: "Tasks",
  knowledge: "Knowledge",
  // Knowledge-type blocks (first-class)
  documents: "Documents",
  images: "Images",
  videos: "Videos",
  audios: "Audios",
  tables: "Tables",
  forms: "Forms",
  links: "Links",
  feeds: "Feeds",
  apps: "Apps",
  // Operations blocks
  messages: "Messages",
};

/** Blocks that should never appear as benefit options */
export const NON_BENEFIT_BLOCKS = new Set(["subscriptions", "knowledge"]);

/** Default benefit blocks when setting doesn't exist (preserves current behavior) */
export const DEFAULT_BENEFIT_BLOCKS = "products,agents,partners,perks,community";

/** Setting key in the Setting table */
export const BENEFIT_BLOCKS_SETTING_KEY = "plan_benefit_blocks";

/** Blocks that require a saved tierId before their benefit tab can be used */
export const BLOCKS_REQUIRING_TIER_ID = new Set(["products", "agents", "partners"]);

/** Ordered list of all block names eligible as benefits */
export const ALL_BENEFIT_ELIGIBLE_BLOCKS = Object.keys(BLOCK_ICON_MAP);
