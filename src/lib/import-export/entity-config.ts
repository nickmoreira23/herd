export interface ExportableColumn {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "decimal" | "string[]";
  enumValues?: readonly string[];
}

export interface EntityConfig {
  entityType: string;
  displayName: string;
  displayNameSingular: string;
  identifierField: string;
  identifierLabel: string;
  columns: ExportableColumn[];
  prismaModel: string;
  apiBasePath: string;
}

// ─── Products ─────────────────────────���─────────────────────────────

export const productConfig: EntityConfig = {
  entityType: "products",
  displayName: "Products",
  displayNameSingular: "Product",
  identifierField: "sku",
  identifierLabel: "SKU",
  prismaModel: "product",
  apiBasePath: "/api/products",
  columns: [
    { key: "name", label: "Name", type: "string" },
    { key: "category", label: "Category", type: "string", enumValues: ["SUPPLEMENT", "APPAREL", "ACCESSORY"] },
    { key: "subCategory", label: "Sub-Category", type: "string" },
    { key: "redemptionType", label: "Redemption Type", type: "string", enumValues: ["Members Store", "Members Rate"] },
    { key: "retailPrice", label: "Retail Price", type: "decimal" },
    { key: "memberPrice", label: "Member Price", type: "decimal" },
    { key: "costOfGoods", label: "COGS", type: "decimal" },
    { key: "weightOz", label: "Weight (oz)", type: "decimal" },
    { key: "isActive", label: "Active", type: "boolean" },
    { key: "tags", label: "Tags", type: "string[]" },
    { key: "description", label: "Description", type: "string" },
    { key: "brand", label: "Brand", type: "string" },
    { key: "flavor", label: "Flavor", type: "string" },
    { key: "servingSize", label: "Serving Size", type: "string" },
    { key: "servingsPerContainer", label: "Servings per Container", type: "number" },
    { key: "ingredients", label: "Ingredients", type: "string" },
    { key: "warnings", label: "Warnings", type: "string" },
  ],
};

// ─── Agents ─────────────────────────────────────────────────────────

export const agentConfig: EntityConfig = {
  entityType: "agents",
  displayName: "Agents",
  displayNameSingular: "Agent",
  identifierField: "key",
  identifierLabel: "Key",
  prismaModel: "agent",
  apiBasePath: "/api/agents",
  columns: [
    { key: "name", label: "Name", type: "string" },
    { key: "description", label: "Description", type: "string" },
    { key: "category", label: "Category", type: "string", enumValues: ["NUTRITION", "TRAINING", "RECOVERY", "COACHING", "ANALYTICS"] },
    { key: "status", label: "Status", type: "string", enumValues: ["DRAFT", "ACTIVE", "BETA", "DEPRECATED"] },
    { key: "modelProvider", label: "Model Provider", type: "string" },
    { key: "modelId", label: "Model ID", type: "string" },
    { key: "temperature", label: "Temperature", type: "decimal" },
    { key: "maxTokens", label: "Max Tokens", type: "number" },
    { key: "dailyUsageLimit", label: "Daily Usage Limit", type: "number" },
    { key: "monthlyCostEstimate", label: "Monthly Cost Estimate", type: "decimal" },
    { key: "avgTokensPerCall", label: "Avg Tokens/Call", type: "number" },
    { key: "requiresMedia", label: "Requires Media", type: "boolean" },
    { key: "requiresHealth", label: "Requires Health", type: "boolean" },
    { key: "isConversational", label: "Conversational", type: "boolean" },
    { key: "responseFormat", label: "Response Format", type: "string" },
    { key: "version", label: "Version", type: "string" },
    { key: "tags", label: "Tags", type: "string[]" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
  ],
};

// ─── Perks ──────────────────────────────────────────────────────────

export const perkConfig: EntityConfig = {
  entityType: "perks",
  displayName: "Perks",
  displayNameSingular: "Perk",
  identifierField: "key",
  identifierLabel: "Key",
  prismaModel: "perk",
  apiBasePath: "/api/perks",
  columns: [
    { key: "name", label: "Name", type: "string" },
    { key: "description", label: "Description", type: "string" },
    { key: "longDescription", label: "Long Description", type: "string" },
    { key: "icon", label: "Icon", type: "string" },
    { key: "status", label: "Status", type: "string", enumValues: ["DRAFT", "ACTIVE", "ARCHIVED"] },
    { key: "hasSubConfig", label: "Has Sub-Config", type: "boolean" },
    { key: "subConfigLabel", label: "Sub-Config Label", type: "string" },
    { key: "subConfigType", label: "Sub-Config Type", type: "string" },
    { key: "subConfigOptions", label: "Sub-Config Options", type: "string[]" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
    { key: "tags", label: "Tags", type: "string[]" },
  ],
};

// ─── Community Benefits ─────────────────────────────────────────────

export const communityConfig: EntityConfig = {
  entityType: "community",
  displayName: "Community Benefits",
  displayNameSingular: "Community Benefit",
  identifierField: "key",
  identifierLabel: "Key",
  prismaModel: "communityBenefit",
  apiBasePath: "/api/community",
  columns: [
    { key: "name", label: "Name", type: "string" },
    { key: "description", label: "Description", type: "string" },
    { key: "longDescription", label: "Long Description", type: "string" },
    { key: "icon", label: "Icon", type: "string" },
    { key: "status", label: "Status", type: "string", enumValues: ["DRAFT", "ACTIVE", "ARCHIVED"] },
    { key: "platform", label: "Platform", type: "string", enumValues: ["discord", "zoom", "forum", "slack", "in-person", "other"] },
    { key: "accessUrl", label: "Access URL", type: "string" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
    { key: "tags", label: "Tags", type: "string[]" },
  ],
};

// ─── Partners ───────────────────────────────────────────────────────

export const partnerConfig: EntityConfig = {
  entityType: "partners",
  displayName: "Partners",
  displayNameSingular: "Partner",
  identifierField: "key",
  identifierLabel: "Key",
  prismaModel: "partnerBrand",
  apiBasePath: "/api/partners",
  columns: [
    { key: "name", label: "Name", type: "string" },
    { key: "category", label: "Category", type: "string" },
    { key: "status", label: "Status", type: "string", enumValues: ["RESEARCHED", "APPLIED", "APPROVED", "ACTIVE", "PAUSED"] },
    { key: "kickbackType", label: "Kickback Type", type: "string", enumValues: ["NONE", "PERCENT_OF_SALE", "FLAT_PER_REFERRAL", "FLAT_PER_MONTH"] },
    { key: "kickbackValue", label: "Kickback Value", type: "decimal" },
    { key: "discountDescription", label: "Discount Description", type: "string" },
    { key: "tagline", label: "Tagline", type: "string" },
    { key: "description", label: "Description", type: "string" },
    { key: "websiteUrl", label: "Website URL", type: "string" },
    { key: "audienceBenefit", label: "Audience Benefit", type: "string" },
    { key: "benefitType", label: "Benefit Type", type: "string", enumValues: ["PERCENTAGE_DISCOUNT", "FLAT_DISCOUNT", "FREE_TRIAL", "FREE_PRODUCT", "BOGO", "OTHER"] },
    { key: "affiliateSignupUrl", label: "Affiliate Signup URL", type: "string" },
    { key: "affiliateLinkPlaceholder", label: "Affiliate Link", type: "string" },
    { key: "affiliateNetwork", label: "Affiliate Network", type: "string" },
    { key: "commissionRate", label: "Commission Rate", type: "string" },
    { key: "commissionType", label: "Commission Type", type: "string", enumValues: ["PERCENTAGE", "FLAT", "CPA", "RECURRING", "HYBRID"] },
    { key: "cookieDuration", label: "Cookie Duration", type: "string" },
    { key: "tierAccess", label: "Tier Access", type: "string", enumValues: ["ALL", "BASIC", "PLUS", "PREMIUM", "ELITE"] },
    { key: "notes", label: "Notes", type: "string" },
  ],
};

// ─── Registry ───────────────────────────────────────────────────────

export const entityConfigs: Record<string, EntityConfig> = {
  products: productConfig,
  agents: agentConfig,
  perks: perkConfig,
  community: communityConfig,
  partners: partnerConfig,
};
