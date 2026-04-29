import type { LucideIcon } from "lucide-react";
import {
  Scale,
  Megaphone,
  Target,
  BarChart3,
  Wrench,
  TrendingUp,
  CreditCard,
  Wallet,
  FileText,
  FileSignature,
  Rocket,
  PenTool,
  GitBranch,
  Workflow,
  Boxes,
  Flag,
} from "lucide-react";

/** Map tool category icon strings to LucideIcon components */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Scale,
  Megaphone,
  Target,
  BarChart3,
  Workflow,
};

/** Map tool icon strings to LucideIcon components */
export const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  CreditCard,
  Wallet,
  FileText,
  FileSignature,
  Rocket,
  PenTool,
  BarChart3,
  GitBranch,
  Target,
  Megaphone,
  Scale,
  Boxes,
  Flag,
};

export const DEFAULT_CATEGORY_ICON: LucideIcon = Wrench;
