import {
  Users,
  Globe,
  DollarSign,
  Award,
  Star,
  BarChart3,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface PermissionMeta {
  title: string
  description: string
}

export interface ResourceMeta {
  label: string
  description: string
  icon: LucideIcon
}

export const RESOURCE_META: Record<string, ResourceMeta> = {
  profiles: {
    label: "Profiles",
    description: "Member and distributor profile management",
    icon: Users,
  },
  network: {
    label: "Network",
    description: "Network structure and organization visibility",
    icon: Globe,
  },
  commissions: {
    label: "Commissions",
    description: "Commission plans, payouts, and financial tracking",
    icon: DollarSign,
  },
  ranks: {
    label: "Ranks",
    description: "Rank definitions, advancement criteria, and evaluations",
    icon: Award,
  },
  points: {
    label: "Points",
    description: "Point balances, accruals, and adjustments",
    icon: Star,
  },
  reports: {
    label: "Reports",
    description: "Analytics dashboards and report generation",
    icon: BarChart3,
  },
  teams: {
    label: "Teams",
    description: "Team creation, membership, and management",
    icon: UsersRound,
  },
  settings: {
    label: "Settings",
    description: "System configuration and application preferences",
    icon: Settings,
  },
}

export const PERMISSION_META: Record<string, PermissionMeta> = {
  // Profiles
  "profiles:view": {
    title: "View Profiles",
    description: "Browse and view member profile details and contact information",
  },
  "profiles:create": {
    title: "Create Profiles",
    description: "Add new member profiles to the network",
  },
  "profiles:edit": {
    title: "Edit Profiles",
    description: "Modify existing member profile information and status",
  },
  "profiles:delete": {
    title: "Delete Profiles",
    description: "Permanently remove member profiles from the system",
  },
  "profiles:export": {
    title: "Export Profiles",
    description: "Download profile data as CSV or other file formats",
  },

  // Network
  "network:view_internal": {
    title: "View Internal Network",
    description: "Access and browse the internal organizational network",
  },
  "network:view_external": {
    title: "View External Network",
    description: "Access and browse the external distributor network",
  },
  "network:manage_hierarchy": {
    title: "Manage Hierarchy",
    description: "Create, modify, and delete team structures and reporting lines",
  },

  // Commissions
  "commissions:view": {
    title: "View Commissions",
    description: "See commission calculations, statements, and payout history",
  },
  "commissions:configure": {
    title: "Configure Commissions",
    description: "Set up and modify commission plans, rates, and bonus rules",
  },
  "commissions:approve": {
    title: "Approve Commissions",
    description: "Review and approve pending commission payouts for processing",
  },
  "commissions:export": {
    title: "Export Commissions",
    description: "Download commission reports and payout data as files",
  },

  // Ranks
  "ranks:view": {
    title: "View Ranks",
    description: "See rank definitions, requirements, and member rank status",
  },
  "ranks:configure": {
    title: "Configure Ranks",
    description: "Create and modify rank levels, titles, and qualification criteria",
  },
  "ranks:evaluate": {
    title: "Evaluate Ranks",
    description: "Run rank qualification evaluations and process advancements",
  },

  // Points
  "points:view": {
    title: "View Points",
    description: "See point balances, transaction history, and accrual details",
  },
  "points:adjust": {
    title: "Adjust Points",
    description: "Manually add, deduct, or transfer points on member accounts",
  },
  "points:export": {
    title: "Export Points",
    description: "Download point ledger data and transaction reports",
  },

  // Reports
  "reports:view": {
    title: "View Reports",
    description: "Access pre-built dashboards and analytics reports",
  },
  "reports:create": {
    title: "Create Reports",
    description: "Build new custom reports with filters and visualizations",
  },
  "reports:export": {
    title: "Export Reports",
    description: "Download report data and charts as files",
  },

  // Teams
  "teams:view": {
    title: "View Teams",
    description: "Browse team rosters, details, and membership lists",
  },
  "teams:create": {
    title: "Create Teams",
    description: "Set up new teams and define their initial membership",
  },
  "teams:edit": {
    title: "Edit Teams",
    description: "Modify team names, descriptions, and member assignments",
  },
  "teams:delete": {
    title: "Delete Teams",
    description: "Remove teams and disband their member associations",
  },

  // Settings
  "settings:view": {
    title: "View Settings",
    description: "Access system configuration and preference panels",
  },
  "settings:edit": {
    title: "Edit Settings",
    description: "Modify system configuration, preferences, and defaults",
  },
}

export function getPermissionMeta(resource: string, action: string): PermissionMeta {
  const key = `${resource}:${action}`
  if (PERMISSION_META[key]) return PERMISSION_META[key]
  // Fallback: derive title from action slug
  const title = action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return { title, description: `${title} within ${resource}` }
}

export function getResourceMeta(resource: string): ResourceMeta {
  if (RESOURCE_META[resource]) return RESOURCE_META[resource]
  return {
    label: resource.charAt(0).toUpperCase() + resource.slice(1),
    description: `Manage ${resource}`,
    icon: Settings,
  }
}
