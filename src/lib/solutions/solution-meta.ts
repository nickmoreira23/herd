import type { LucideIcon } from "lucide-react";
import {
  Scale,
  Megaphone,
  Target,
  BarChart3,
  Lightbulb,
  TrendingUp,
  CreditCard,
  Wallet,
  FileText,
  FileSignature,
  Rocket,
  PenTool,
  GitBranch,
} from "lucide-react";

/** Map solution icon strings to LucideIcon components */
export const SOLUTION_ICON_MAP: Record<string, LucideIcon> = {
  Scale,
  Megaphone,
  Target,
  BarChart3,
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
};

export const DEFAULT_SOLUTION_ICON: LucideIcon = Lightbulb;
