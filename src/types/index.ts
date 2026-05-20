// Shared types for the HERD OS application
// Re-export Prisma types for convenience
export type {
  Agent,
  AgentTierAccess,
  AgentKnowledgeItem,
  AgentSkill,
  AgentTool,
  Product,
  SubscriptionTier,
  FinancialSnapshot,
  Setting,
  OpexCategory,
  OpexItem,
  OpexMilestone,
  SubscriptionRedemptionRule,
  TierPricingSnapshot,
  Perk,
  PerkTierAssignment,
  CommunityBenefit,
  CommunityBenefitTierAssignment,
  NetworkProfile,
  // Integration types
  Integration,
  IntegrationTierMapping,
  IntegrationWebhookEvent,
  IntegrationSyncLog,
  MemberConnection,
  // Landing Page types
  LandingPage,
  LandingPageVersion,
  LandingPageSection,
} from "@prisma/client";

export {
  AgentStatus,
  AgentCategory,
  KnowledgeItemType,
  KnowledgeItemStatus,
  AgentToolAuthType,
  SubscriptionStatus,
  SubscriptionVisibility,
  BillingAnchor,
  CreditIssuingTiming,
  CreditExpiryBehavior,
  TierChangeTiming,
  CreditOnChange,
  PauseCreditBehavior,
  // Network enums
  NetworkType,
  ProfileStatus,
  PerkStatus,
  CommunityBenefitStatus,
  // Integration enums
  IntegrationCategory,
  IntegrationStatus,
  SyncDirection,
  // Landing Page enums
  LandingPageStatus,
} from "@prisma/client";

// Redemption rule scope and type enums
export const REDEMPTION_RULE_TYPES = ["MEMBERS_STORE", "MEMBERS_RATE"] as const;
export type RedemptionRuleType = (typeof REDEMPTION_RULE_TYPES)[number];

export const SCOPE_TYPES = ["CATEGORY", "SUB_CATEGORY", "SKU"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

// API response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// Category enum values
export const PRODUCT_CATEGORIES = ["SUPPLEMENT", "APPAREL", "ACCESSORY"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Sub-category options per category
export const SUB_CATEGORIES: Record<string, string[]> = {
  SUPPLEMENT: ["Pre-Workout", "Protein", "Amino", "Vitamin", "Health", "Recovery", "Other"],
  APPAREL: ["Tee", "Hoodie", "Shorts", "Hat", "Other"],
  ACCESSORY: ["Shaker", "Bag", "Gear", "Other"],
};

// Redemption type values
export const REDEMPTION_TYPES = ["Members Store", "Members Rate"] as const;
export type RedemptionType = (typeof REDEMPTION_TYPES)[number];

// Apparel cadence enum values
export const APPAREL_CADENCES = ["NONE", "QUARTERLY", "MONTHLY"] as const;
export type ApparelCadence = (typeof APPAREL_CADENCES)[number];

// Billing cycle enum values
export const BILLING_CYCLES = ["MONTHLY", "QUARTERLY", "ANNUAL"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

// Kickback type enum values
export const KICKBACK_TYPES = [
  "NONE",
  "PERCENT_OF_SALE",
  "FLAT_PER_REFERRAL",
  "FLAT_PER_MONTH",
] as const;
export type KickbackType = (typeof KICKBACK_TYPES)[number];

// Partner enum values (PARTNER_BENEFIT_TYPES, PARTNER_COMMISSION_TYPES,
// PARTNER_STATUSES, PARTNER_TIER_ACCESS, PARTNER_CATEGORIES) removed in
// Sub-etapa 3.5.5 along with the PartnerBrand model. External affiliate
// concept returns later as company profile in network.

// AI Agent enum values
export const AGENT_STATUSES = ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"] as const;
export type AgentStatusValue = (typeof AGENT_STATUSES)[number];

export const AGENT_CATEGORIES = ["NUTRITION", "TRAINING", "RECOVERY", "COACHING", "ANALYTICS", "IMAGE_GENERATION", "VIDEO_GENERATION", "VOICE", "MULTIMODAL"] as const;
export type AgentCategoryValue = (typeof AGENT_CATEGORIES)[number];

export const MODEL_TYPES = ["TEXT", "IMAGE", "VIDEO", "VOICE"] as const;
export type ModelTypeValue = (typeof MODEL_TYPES)[number];

export const KNOWLEDGE_ITEM_TYPES = ["DOCUMENT", "URL", "TEXT", "FAQ", "API_REFERENCE"] as const;
export type KnowledgeItemTypeValue = (typeof KNOWLEDGE_ITEM_TYPES)[number];

export const KNOWLEDGE_ITEM_STATUSES = ["DRAFT", "PROCESSING", "ACTIVE", "ERROR", "ARCHIVED"] as const;
export type KnowledgeItemStatusValue = (typeof KNOWLEDGE_ITEM_STATUSES)[number];

export const AGENT_TOOL_AUTH_TYPES = ["NONE", "API_KEY", "OAUTH2", "BEARER_TOKEN", "CUSTOM_HEADER"] as const;
export type AgentToolAuthTypeValue = (typeof AGENT_TOOL_AUTH_TYPES)[number];

export const AGENT_ROLES = ["ORCHESTRATOR", "SPECIALIST", "BLOCK"] as const;
export type AgentRoleValue = (typeof AGENT_ROLES)[number];

// Perk enum values
export const PERK_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type PerkStatusValue = (typeof PERK_STATUSES)[number];

// Community Benefit enum values
export const COMMUNITY_BENEFIT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type CommunityBenefitStatusValue = (typeof COMMUNITY_BENEFIT_STATUSES)[number];

export const COMMUNITY_PLATFORMS = ["discord", "zoom", "forum", "slack", "in-person", "other"] as const;
export type CommunityPlatform = (typeof COMMUNITY_PLATFORMS)[number];

// Profile status enum values
export const PROFILE_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "TERMINATED"] as const;
export type ProfileStatusValue = (typeof PROFILE_STATUSES)[number];

// Network type enum values
export const NETWORK_TYPES = ["INTERNAL", "EXTERNAL"] as const;
export type NetworkTypeValue = (typeof NETWORK_TYPES)[number];

// Integration enum values
export const INTEGRATION_CATEGORIES = [
  "BILLING", "PAYMENT", "CRM", "ANALYTICS", "MARKETING", "COMMUNICATION", "SUPPORT", "MEETINGS", "PROJECT_MANAGEMENT", "SOCIAL_MEDIA", "AI_MODELS", "OTHER",
] as const;
export type IntegrationCategoryValue = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_STATUSES = [
  "AVAILABLE", "CONNECTED", "ERROR", "DISABLED",
] as const;
export type IntegrationStatusValue = (typeof INTEGRATION_STATUSES)[number];

export const SYNC_DIRECTIONS = [
  "INCOMING", "OUTGOING", "BIDIRECTIONAL",
] as const;
export type SyncDirectionValue = (typeof SYNC_DIRECTIONS)[number];

// Knowledge App enum values
export const KNOWLEDGE_APP_CATEGORIES = ["FITNESS", "HEALTH", "NUTRITION", "OTHER"] as const;
export type KnowledgeAppCategoryValue = (typeof KNOWLEDGE_APP_CATEGORIES)[number];

export const KNOWLEDGE_APP_DATA_CATEGORIES = [
  "SLEEP", "ACTIVITY", "RECOVERY", "HEART_RATE", "WORKOUT", "READINESS", "BODY", "APP_NUTRITION", "APP_OTHER",
] as const;
export type KnowledgeAppDataCategoryValue = (typeof KNOWLEDGE_APP_DATA_CATEGORIES)[number];

export const KNOWLEDGE_APP_AUTH_TYPES = ["oauth2", "api_key"] as const;
export type KnowledgeAppAuthTypeValue = (typeof KNOWLEDGE_APP_AUTH_TYPES)[number];

// Landing Page enum values
export const LANDING_PAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type LandingPageStatusValue = (typeof LANDING_PAGE_STATUSES)[number];
