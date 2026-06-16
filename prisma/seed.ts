import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// NON-DESTRUCTIVE SEED — upserts only, never deletes existing data.
// Financial snapshots, opex data, and user-created records are NEVER touched.
// ============================================================================

async function main() {
  console.log("Seeding database (non-destructive upsert mode)...\n");

  // ==============================================
  // CATALOG TENANT (Product.tenantId is NOT NULL)
  // ==============================================
  console.log("Ensuring catalog org (buckedup)...");

  const catalogOrg = await prisma.organization.upsert({
    where: { slug: "buckedup" },
    update: {},
    create: { slug: "buckedup", subdomain: "buckedup", name: "Bucked Up" },
  });

  // ========================
  // PRODUCTS (upsert by SKU)
  // ========================
  console.log("Seeding products...");

  const productData = [
    // Pre-workouts
    { name: "Bucked Up Original", sku: "BU-PRE-001", category: "SUPPLEMENT", subCategory: "Pre-Workout", retailPrice: 49.99, memberPrice: 42.99, costOfGoods: 7.5, tags: ["pre-workout", "energy", "pump"], isActive: true },
    { name: "WOKE AF", sku: "BU-PRE-002", category: "SUPPLEMENT", subCategory: "Pre-Workout", retailPrice: 54.99, memberPrice: 46.99, costOfGoods: 8.0, tags: ["pre-workout", "high-stim", "energy"], isActive: true },
    { name: "BAMF", sku: "BU-PRE-003", category: "SUPPLEMENT", subCategory: "Pre-Workout", retailPrice: 54.99, memberPrice: 46.99, costOfGoods: 8.5, tags: ["pre-workout", "nootropic", "focus"], isActive: true },
    { name: "Mother Bucker", sku: "BU-PRE-004", category: "SUPPLEMENT", subCategory: "Pre-Workout", retailPrice: 59.99, memberPrice: 49.99, costOfGoods: 9.0, tags: ["pre-workout", "ultra-stim", "advanced"], isActive: true },
    { name: "LFG Pre-Workout", sku: "BU-PRE-005", category: "SUPPLEMENT", subCategory: "Pre-Workout", retailPrice: 44.99, memberPrice: 37.99, costOfGoods: 6.5, tags: ["pre-workout", "beginner-friendly"], isActive: true },
    // Protein
    { name: "Bucked Up Protein", sku: "BU-PROT-001", category: "SUPPLEMENT", subCategory: "Protein", retailPrice: 54.99, memberPrice: 46.99, costOfGoods: 10.0, tags: ["protein", "whey", "recovery"], isActive: true },
    { name: "Casein Protein", sku: "BU-PROT-002", category: "SUPPLEMENT", subCategory: "Protein", retailPrice: 49.99, memberPrice: 42.99, costOfGoods: 9.5, tags: ["protein", "casein", "slow-release"], isActive: true },
    { name: "Plant Protein", sku: "BU-PROT-003", category: "SUPPLEMENT", subCategory: "Protein", retailPrice: 49.99, memberPrice: 42.99, costOfGoods: 11.0, tags: ["protein", "plant-based", "vegan"], isActive: true },
    // Aminos & Recovery
    { name: "RACKED BCAAs", sku: "BU-AMI-001", category: "SUPPLEMENT", subCategory: "Amino", retailPrice: 39.99, memberPrice: 33.99, costOfGoods: 5.5, tags: ["aminos", "bcaa", "recovery"], isActive: true },
    { name: "Creatine Monohydrate", sku: "BU-AMI-002", category: "SUPPLEMENT", subCategory: "Recovery", retailPrice: 34.99, memberPrice: 29.99, costOfGoods: 4.5, tags: ["creatine", "strength", "recovery"], isActive: true },
    { name: "Glutamine Recovery", sku: "BU-AMI-003", category: "SUPPLEMENT", subCategory: "Recovery", retailPrice: 29.99, memberPrice: 24.99, costOfGoods: 4.0, tags: ["glutamine", "recovery", "gut-health"], isActive: true },
    { name: "EAAs Essential Aminos", sku: "BU-AMI-004", category: "SUPPLEMENT", subCategory: "Amino", retailPrice: 39.99, memberPrice: 33.99, costOfGoods: 5.0, tags: ["eaa", "aminos", "intra-workout"], isActive: true },
    // Health & Wellness
    { name: "Babe Collagen", sku: "BU-HLT-001", category: "SUPPLEMENT", subCategory: "Health", retailPrice: 44.99, memberPrice: 37.99, costOfGoods: 6.0, tags: ["collagen", "beauty", "health"], isActive: true },
    { name: "Supergreens", sku: "BU-HLT-002", category: "SUPPLEMENT", subCategory: "Health", retailPrice: 49.99, memberPrice: 42.99, costOfGoods: 7.0, tags: ["greens", "superfood", "health"], isActive: true },
    { name: "Multi-Vitamin", sku: "BU-HLT-003", category: "SUPPLEMENT", subCategory: "Vitamin", retailPrice: 34.99, memberPrice: 29.99, costOfGoods: 5.0, tags: ["vitamin", "daily", "health"], isActive: true },
    { name: "Immune Support", sku: "BU-HLT-004", category: "SUPPLEMENT", subCategory: "Vitamin", retailPrice: 29.99, memberPrice: 24.99, costOfGoods: 4.5, tags: ["immune", "vitamin-c", "zinc"], isActive: true },
    { name: "Sleep Aid Formula", sku: "BU-HLT-005", category: "SUPPLEMENT", subCategory: "Health", retailPrice: 34.99, memberPrice: 29.99, costOfGoods: 5.5, tags: ["sleep", "recovery", "melatonin"], isActive: true },
    { name: "Omega-3 Fish Oil", sku: "BU-HLT-006", category: "SUPPLEMENT", subCategory: "Health", retailPrice: 29.99, memberPrice: 24.99, costOfGoods: 4.0, tags: ["omega-3", "heart-health", "daily"], isActive: true },
    // Apparel
    { name: "Performance Tee", sku: "BU-APP-001", category: "APPAREL", subCategory: "Tee", retailPrice: 34.99, memberPrice: 27.99, costOfGoods: 6.0, tags: ["tee", "training", "performance"], weightOz: 6.0, isActive: true },
    { name: "Bucked Up Hoodie", sku: "BU-APP-002", category: "APPAREL", subCategory: "Hoodie", retailPrice: 64.99, memberPrice: 52.99, costOfGoods: 14.0, tags: ["hoodie", "outerwear", "premium"], weightOz: 16.0, isActive: true },
    { name: "Training Joggers", sku: "BU-APP-003", category: "APPAREL", subCategory: "Shorts", retailPrice: 59.99, memberPrice: 49.99, costOfGoods: 12.0, tags: ["joggers", "training", "comfort"], weightOz: 12.0, isActive: true },
    { name: "Stringer Tank", sku: "BU-APP-004", category: "APPAREL", subCategory: "Tee", retailPrice: 29.99, memberPrice: 24.99, costOfGoods: 5.0, tags: ["tank", "gym", "stringer"], weightOz: 4.0, isActive: true },
    { name: "Training Shorts", sku: "BU-APP-005", category: "APPAREL", subCategory: "Shorts", retailPrice: 39.99, memberPrice: 32.99, costOfGoods: 7.0, tags: ["shorts", "training", "athletic"], weightOz: 6.0, isActive: true },
    // Accessories
    { name: "Shaker Bottle", sku: "BU-ACC-001", category: "ACCESSORY", subCategory: "Shaker", retailPrice: 14.99, memberPrice: 11.99, costOfGoods: 2.5, tags: ["shaker", "bottle", "essential"], weightOz: 8.0, isActive: true },
    { name: "Gym Bag", sku: "BU-ACC-002", category: "ACCESSORY", subCategory: "Bag", retailPrice: 49.99, memberPrice: 39.99, costOfGoods: 9.0, tags: ["bag", "gym", "carry"], weightOz: 24.0, isActive: true },
    { name: "Wrist Wraps", sku: "BU-ACC-003", category: "ACCESSORY", subCategory: "Gear", retailPrice: 19.99, memberPrice: 15.99, costOfGoods: 3.0, tags: ["wraps", "support", "lifting"], weightOz: 4.0, isActive: true },
    { name: "Resistance Bands Set", sku: "BU-ACC-004", category: "ACCESSORY", subCategory: "Gear", retailPrice: 24.99, memberPrice: 19.99, costOfGoods: 4.0, tags: ["bands", "resistance", "warm-up"], weightOz: 10.0, isActive: true },
  ];

  const products = await Promise.all(
    productData.map((p) =>
      prisma.product.upsert({
        where: { tenantId_sku: { tenantId: catalogOrg.id, sku: p.sku } },
        update: { subCategory: p.subCategory }, // only patch subCategory onto existing rows
        create: { ...p, tenantId: catalogOrg.id },
      })
    )
  );

  console.log(`  Upserted ${products.length} products`);

  // ========================
  // SUBSCRIPTION TIERS (upsert by slug)
  // ========================
  console.log("Seeding subscription tiers...");

  const tierDefs = [
    {
      slug: "starter",
      data: {
        name: "Starter",
        slug: "starter",
        status: "ACTIVE" as const,
        visibility: "PUBLIC" as const,
        tagline: "Start your journey",
        colorAccent: "#10B981",
        monthlyPrice: 49.0,
        biannualPrice: 44.0,
        annualPrice: 39.0,
        setupFee: 0,
        trialDays: 7,
        monthlyCredits: 55.0,
        creditExpirationDays: 60,
        rolloverMonths: 0,
        annualBonusCredits: 0,
        referralCreditAmt: 10,
        partnerDiscountPercent: 0,
        includedAIFeatures: ["workout-generator"],
        apparelCadence: "NONE",
        sortOrder: 0,
        isActive: true,
        isFeatured: false,
        minimumCommitMonths: 1,
        pauseAllowed: false,
        winbackDays: 14,
        winbackBonusCredits: 10,
        description: "Perfect for getting started with member pricing and AI workouts.",
        highlightFeatures: [
          "$55 in monthly credits",
          "AI Workout Generator",
          "Member pricing on all products",
          "Cancel anytime",
        ],
        agentConfig: { workout_ai: true },
        communityConfig: { member_forum: true },
        perksConfig: { free_shipping: { enabled: false } },
      },
    },
    {
      slug: "performance",
      data: {
        name: "Performance",
        slug: "performance",
        status: "ACTIVE" as const,
        visibility: "PUBLIC" as const,
        tagline: "Serious results, serious value",
        colorAccent: "#C5F135",
        monthlyPrice: 99.0,
        biannualPrice: 89.0,
        annualPrice: 79.0,
        setupFee: 0,
        trialDays: 7,
        monthlyCredits: 135.0,
        creditExpirationDays: 60,
        rolloverMonths: 1,
        annualBonusCredits: 50,
        referralCreditAmt: 20,
        partnerDiscountPercent: 10,
        includedAIFeatures: ["workout-generator", "meal-planner"],
        apparelCadence: "NONE",
        sortOrder: 1,
        isActive: true,
        isFeatured: true,
        minimumCommitMonths: 1,
        pauseAllowed: true,
        pauseMaxMonths: 1,
        winbackDays: 30,
        winbackBonusCredits: 25,
        description: "Our most popular tier with serious credit value and AI coaching.",
        highlightFeatures: [
          "$135 in monthly credits",
          "AI Workouts + Meal Planning",
          "10% partner discounts",
          "Save up to 30% with annual billing",
        ],
        agentConfig: { workout_ai: true, meal_plan: true },
        communityConfig: { member_forum: true, private_discord: true },
        perksConfig: { free_shipping: { enabled: true }, birthday_credits: { enabled: true, amount: 15 } },
      },
    },
    {
      slug: "elite",
      data: {
        name: "Elite",
        slug: "elite",
        status: "ACTIVE" as const,
        visibility: "PUBLIC" as const,
        tagline: "Premium performance, premium perks",
        colorAccent: "#8B5CF6",
        monthlyPrice: 199.0,
        biannualPrice: 179.0,
        annualPrice: 159.0,
        setupFee: 0,
        trialDays: 0,
        monthlyCredits: 310.0,
        creditExpirationDays: 60,
        rolloverMonths: 2,
        rolloverCap: 400,
        annualBonusCredits: 100,
        referralCreditAmt: 30,
        partnerDiscountPercent: 20,
        includedAIFeatures: [
          "workout-generator",
          "meal-planner",
          "sleep-coach",
          "supplement-advisor",
        ],
        apparelCadence: "QUARTERLY",
        apparelBudget: 14.0,
        sortOrder: 2,
        isActive: true,
        isFeatured: false,
        minimumCommitMonths: 3,
        pauseAllowed: true,
        pauseMaxMonths: 2,
        winbackDays: 60,
        winbackBonusCredits: 50,
        exitSurveyRequired: true,
        description: "Premium tier with quarterly apparel drops and the full AI suite.",
        highlightFeatures: [
          "$310 in monthly credits",
          "Full AI Suite (workouts, meals, sleep, supplements)",
          "20% partner discounts",
          "Quarterly apparel drop included",
        ],
        agentConfig: { workout_ai: true, meal_plan: true, supplement_advisor: true, progress_tracker: true },
        communityConfig: { member_forum: true, private_discord: true, group_coaching: true },
        perksConfig: {
          free_shipping: { enabled: true },
          birthday_credits: { enabled: true, amount: 25 },
          priority_support: { enabled: true, tier: "priority" },
          early_access: { enabled: true },
        },
      },
    },
    {
      slug: "legend",
      data: {
        name: "Legend",
        slug: "legend",
        status: "ACTIVE" as const,
        visibility: "REP_ONLY" as const,
        tagline: "By invitation only",
        colorAccent: "#F59E0B",
        monthlyPrice: 299.0,
        biannualPrice: 269.0,
        annualPrice: 239.0,
        setupFee: 0,
        trialDays: 0,
        monthlyCredits: 480.0,
        creditExpirationDays: 60,
        rolloverMonths: 3,
        rolloverCap: 800,
        annualBonusCredits: 200,
        referralCreditAmt: 50,
        partnerDiscountPercent: 30,
        inviteOnly: true,
        repChannelOnly: true,
        includedAIFeatures: [
          "workout-generator",
          "meal-planner",
          "sleep-coach",
          "supplement-advisor",
          "priority-support",
        ],
        apparelCadence: "MONTHLY",
        apparelBudget: 14.0,
        sortOrder: 3,
        isActive: true,
        isFeatured: false,
        minimumCommitMonths: 6,
        pauseAllowed: true,
        pauseMaxMonths: 3,
        winbackDays: 90,
        winbackBonusCredits: 100,
        exitSurveyRequired: true,
        description: "The ultimate tier with monthly apparel, maximum credits, and priority everything.",
        highlightFeatures: [
          "$480 in monthly credits",
          "Full AI Suite + Priority Support",
          "30% partner discounts",
          "Monthly apparel drop included",
        ],
        agentConfig: { workout_ai: true, meal_plan: true, supplement_advisor: true, progress_tracker: true, recipe_generator: true, coach_chat: true, form_check: true, recovery_advisor: true },
        communityConfig: { member_forum: true, private_discord: true, group_coaching: true, accountability_pods: true, local_meetups: true },
        perksConfig: {
          free_shipping: { enabled: true },
          birthday_credits: { enabled: true, amount: 50 },
          priority_support: { enabled: true, tier: "vip" },
          early_access: { enabled: true },
          gift_box: { enabled: true, value: 75 },
          exclusive_content: { enabled: true },
        },
      },
    },
  ];

  const [starter, performance, elite, legend] = await Promise.all(
    tierDefs.map((t) =>
      prisma.subscriptionTier.upsert({
        // L1b.3 — slug is unique per tenant now; key on the composite.
        where: { tenantId_slug: { tenantId: catalogOrg.id, slug: t.slug } },
        update: {}, // don't overwrite user edits
        create: { ...t.data, tenantId: catalogOrg.id }, // L1b.1 — stamp catalog owner
      })
    )
  );

  console.log(`  Upserted ${tierDefs.length} subscription tiers`);

  // ========================
  // REDEMPTION RULES (upsert by composite unique)
  // ========================
  console.log("Seeding redemption rules...");

  const redemptionRuleData = [
    // Legend — Members Store
    { tierId: legend.id, redemptionType: "MEMBERS_STORE", discountPercent: 40, scopeType: "CATEGORY", scopeValue: "APPAREL" },
    { tierId: legend.id, redemptionType: "MEMBERS_STORE", discountPercent: 40, scopeType: "SUB_CATEGORY", scopeValue: "Pre-Workout" },
    { tierId: legend.id, redemptionType: "MEMBERS_STORE", discountPercent: 35, scopeType: "SUB_CATEGORY", scopeValue: "Health" },
    // Legend — Members Rate
    { tierId: legend.id, redemptionType: "MEMBERS_RATE", discountPercent: 20, scopeType: "SUB_CATEGORY", scopeValue: "Protein" },
    { tierId: legend.id, redemptionType: "MEMBERS_RATE", discountPercent: 20, scopeType: "SUB_CATEGORY", scopeValue: "Amino" },
    // Elite — Members Store
    { tierId: elite.id, redemptionType: "MEMBERS_STORE", discountPercent: 30, scopeType: "CATEGORY", scopeValue: "SUPPLEMENT" },
    { tierId: elite.id, redemptionType: "MEMBERS_STORE", discountPercent: 25, scopeType: "CATEGORY", scopeValue: "APPAREL" },
    // Performance — Members Rate
    { tierId: performance.id, redemptionType: "MEMBERS_RATE", discountPercent: 15, scopeType: "CATEGORY", scopeValue: "SUPPLEMENT" },
    { tierId: performance.id, redemptionType: "MEMBERS_RATE", discountPercent: 10, scopeType: "CATEGORY", scopeValue: "ACCESSORY" },
  ];

  await Promise.all(
    redemptionRuleData.map((r) =>
      prisma.subscriptionRedemptionRule.upsert({
        where: {
          subscriptionTierId_redemptionType_scopeType_scopeValue: {
            subscriptionTierId: r.tierId,
            redemptionType: r.redemptionType,
            scopeType: r.scopeType,
            scopeValue: r.scopeValue,
          },
        },
        update: {}, // don't overwrite user edits to discountPercent
        create: {
          subscriptionTierId: r.tierId,
          redemptionType: r.redemptionType,
          discountPercent: r.discountPercent,
          scopeType: r.scopeType,
          scopeValue: r.scopeValue,
        },
      })
    )
  );

  console.log(`  Upserted ${redemptionRuleData.length} redemption rules`);

  // ========================
  // DEFAULT SETTINGS (upsert by key)
  // ========================
  console.log("Seeding default settings...");

  const defaultSettings = [
    { key: "fulfillmentCostPerOrder", value: 3.5 },
    { key: "shippingCostPerOrder", value: 5.0 },
    { key: "marginFloorPercent", value: 40 },
    { key: "defaultBreakageRate", value: 25 },
    { key: "defaultChurnRate", value: 6 },
    { key: "companyName", value: "Bucked Up" },
    { key: "brandAccentColor", value: "#C8FF00" },
  ];

  await Promise.all(
    defaultSettings.map((s) =>
      prisma.setting.upsert({
        where: { key: s.key },
        update: {}, // don't overwrite user edits
        create: { key: s.key, value: s.value },
      })
    )
  );

  console.log(`  Upserted ${defaultSettings.length} default settings`);

  // ========================
  // AI AGENTS (upsert by key)
  // ========================
  console.log("Seeding AI agents...");

  const agentSeedData = [
    { key: "meal_plan", name: "Meal Plan Generator", description: "AI-powered meal planning based on goals and dietary preferences", category: "NUTRITION" as const, icon: "utensils", sortOrder: 0, status: "ACTIVE" as const, isConversational: false },
    { key: "workout_ai", name: "Workout Builder", description: "Personalized workout programs that adapt over time", category: "TRAINING" as const, icon: "dumbbell", sortOrder: 1, status: "ACTIVE" as const, isConversational: false },
    { key: "supplement_advisor", name: "Supplement Advisor", description: "Personalized supplement stack recommendations", category: "NUTRITION" as const, icon: "pill", sortOrder: 2, status: "ACTIVE" as const, isConversational: false },
    { key: "progress_tracker", name: "Progress Tracker", description: "AI analysis of body composition and performance trends", category: "ANALYTICS" as const, icon: "trending-up", sortOrder: 3, status: "ACTIVE" as const, requiresHealth: true },
    { key: "recipe_generator", name: "Recipe Generator", description: "Macro-friendly recipes based on available ingredients", category: "NUTRITION" as const, icon: "chef-hat", sortOrder: 4, status: "ACTIVE" as const, isConversational: false },
    { key: "coach_chat", name: "AI Coach Chat", description: "24/7 AI coaching for fitness and nutrition questions", category: "COACHING" as const, icon: "message-circle", sortOrder: 5, status: "ACTIVE" as const, isConversational: true },
    { key: "form_check", name: "Form Check", description: "Video-based exercise form analysis and correction", category: "TRAINING" as const, icon: "video", sortOrder: 6, status: "ACTIVE" as const, requiresMedia: true },
    { key: "recovery_advisor", name: "Recovery Advisor", description: "Sleep, stress, and recovery optimization recommendations", category: "RECOVERY" as const, icon: "moon", sortOrder: 7, status: "ACTIVE" as const, requiresHealth: true },
  ];

  for (const agent of agentSeedData) {
    await prisma.agent.upsert({
      where: { key: agent.key },
      update: { name: agent.name, description: agent.description, category: agent.category, icon: agent.icon, sortOrder: agent.sortOrder, status: agent.status },
      create: agent,
    });
  }
  console.log(`  Upserted ${agentSeedData.length} agents`);

  // Block agents — admin-facing, scoped to a single block's CRUD surface
  const blockAgentSeedData = [
    {
      key: "block-products",
      name: "Products Agent",
      description: "Manage the product catalog via natural language — create, update, delete, and bulk-edit products.",
      category: "ANALYTICS" as const,
      icon: "package",
      sortOrder: 100,
      status: "ACTIVE" as const,
      role: "BLOCK" as const,
      scope: "products",
      isConversational: true,
      isSystem: true,
    },
  ];

  for (const agent of blockAgentSeedData) {
    await prisma.agent.upsert({
      where: { key: agent.key },
      update: {
        name: agent.name,
        description: agent.description,
        category: agent.category,
        icon: agent.icon,
        sortOrder: agent.sortOrder,
        status: agent.status,
        role: agent.role,
        scope: agent.scope,
        isConversational: agent.isConversational,
        isSystem: agent.isSystem,
      },
      create: agent,
    });
  }
  console.log(`  Upserted ${blockAgentSeedData.length} block agents`);

  // Create AgentTierAccess rows matching the intended tier→agent mapping
  console.log("Seeding agent-tier assignments...");

  const seededAgents = await prisma.agent.findMany({ select: { id: true, key: true } });
  const agentKeyToId = new Map(seededAgents.map(a => [a.key, a.id]));

  // Define which agents each tier should have (by slug → agent keys)
  const tierAgentMap: Record<string, string[]> = {
    starter: ["workout_ai"],
    performance: ["workout_ai", "meal_plan"],
    elite: ["workout_ai", "meal_plan", "supplement_advisor", "progress_tracker"],
    legend: ["workout_ai", "meal_plan", "supplement_advisor", "progress_tracker", "recipe_generator", "coach_chat", "form_check", "recovery_advisor"],
  };

  const seededTiers = await prisma.subscriptionTier.findMany({ select: { id: true, slug: true } });
  const tierSlugToId = new Map(seededTiers.map(t => [t.slug, t.id]));

  let assignmentCount = 0;
  for (const [tierSlug, agentKeys] of Object.entries(tierAgentMap)) {
    const tierId = tierSlugToId.get(tierSlug);
    if (!tierId) continue;

    for (const agentKey of agentKeys) {
      const agentId = agentKeyToId.get(agentKey);
      if (!agentId) continue;

      await prisma.agentTierAccess.upsert({
        where: {
          agentId_subscriptionTierId: { agentId, subscriptionTierId: tierId },
        },
        update: { isEnabled: true },
        create: { agentId, subscriptionTierId: tierId, isEnabled: true },
      });
      assignmentCount++;
    }
  }
  console.log(`  Seeded ${assignmentCount} agent-tier assignments`);

  // ========================
  // INTEGRATIONS (upsert by slug)
  // ========================
  console.log("\nSeeding integrations...");

  const integrationData = [
    {
      name: "Recharge",
      slug: "recharge",
      description: "Subscription billing and recurring payments platform. Connect to sync subscription plans with ComeçaAI tiers, manage charges, and automate billing workflows.",
      category: "BILLING" as const,
      websiteUrl: "https://rechargepayments.com",
      docsUrl: "https://developer.rechargepayments.com",
      logoUrl: "/integrations/recharge.svg",
    },
    {
      name: "Stripe",
      slug: "stripe",
      description: "Payment processing for internet businesses. Accept payments, manage subscriptions, and handle payouts.",
      category: "PAYMENT" as const,
      websiteUrl: "https://stripe.com",
      docsUrl: "https://docs.stripe.com",
      logoUrl: "/integrations/stripe.svg",
    },
    {
      name: "HubSpot",
      slug: "hubspot",
      description: "CRM platform for marketing, sales, and customer service. Sync contacts, track deals, and automate workflows.",
      category: "CRM" as const,
      websiteUrl: "https://hubspot.com",
      docsUrl: "https://developers.hubspot.com",
      logoUrl: "/integrations/hubspot.svg",
    },
    {
      name: "Attio",
      slug: "attio",
      description: "Next-generation CRM built on your data. Manage people, companies, and deals with powerful lists and automations.",
      category: "CRM" as const,
      websiteUrl: "https://attio.com",
      docsUrl: "https://developers.attio.com",
      logoUrl: "/integrations/attio.svg",
    },
    {
      name: "Salesforce",
      slug: "salesforce",
      description: "Enterprise CRM platform. Manage accounts, contacts, opportunities, and leads with powerful automation and reporting.",
      category: "CRM" as const,
      websiteUrl: "https://salesforce.com",
      docsUrl: "https://developer.salesforce.com/docs",
      logoUrl: "/integrations/salesforce.svg",
    },
    {
      name: "Google Analytics",
      slug: "google-analytics",
      description: "Web analytics service that tracks and reports website traffic. Monitor user behavior and conversion metrics.",
      category: "ANALYTICS" as const,
      websiteUrl: "https://analytics.google.com",
      docsUrl: "https://developers.google.com/analytics",
      logoUrl: "/integrations/google-analytics.svg",
    },
    {
      name: "Google PageSpeed",
      slug: "google-pagespeed",
      description: "Analyze page performance, SEO, and Core Web Vitals using Google Lighthouse. Powers the Page Performance panel in the landing page editor.",
      category: "ANALYTICS" as const,
      websiteUrl: "https://pagespeed.web.dev",
      docsUrl: "https://developers.google.com/speed/docs/insights/v5/get-started",
      logoUrl: "/integrations/google-pagespeed.svg",
    },
    {
      name: "Mixpanel",
      slug: "mixpanel",
      description: "Product analytics platform. Track user interactions, build funnels, and analyze retention to understand how people use your product.",
      category: "ANALYTICS" as const,
      websiteUrl: "https://mixpanel.com",
      docsUrl: "https://developer.mixpanel.com",
      logoUrl: "/integrations/mixpanel.svg",
    },
    {
      name: "Instagram",
      slug: "instagram",
      description: "Photo and video sharing social platform. Manage your business profile, track engagement, and monitor audience growth.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://instagram.com",
      docsUrl: "https://developers.facebook.com/docs/instagram-api",
      logoUrl: "/integrations/instagram.svg",
    },
    {
      name: "X (Twitter)",
      slug: "x-twitter",
      description: "Social media platform for real-time updates. Monitor mentions, track followers, and analyze tweet engagement.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://x.com",
      docsUrl: "https://developer.x.com/en/docs",
      logoUrl: "/integrations/x-twitter.svg",
    },
    {
      name: "Facebook",
      slug: "facebook",
      description: "Social networking platform. Manage pages, track post engagement, and analyze audience insights for your business.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://facebook.com",
      docsUrl: "https://developers.facebook.com/docs/graph-api",
      logoUrl: "/integrations/facebook.svg",
    },
    {
      name: "LinkedIn",
      slug: "linkedin",
      description: "Professional networking platform. Manage company pages, publish content, and analyze professional audience engagement.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://linkedin.com",
      docsUrl: "https://learn.microsoft.com/en-us/linkedin",
      logoUrl: "/integrations/linkedin.svg",
    },
    {
      name: "TikTok",
      slug: "tiktok",
      description: "Short-form video platform. Track video performance, monitor follower growth, and analyze audience engagement.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://tiktok.com",
      docsUrl: "https://developers.tiktok.com/doc",
      logoUrl: "/integrations/tiktok.svg",
    },
    {
      name: "YouTube",
      slug: "youtube",
      description: "Video sharing platform. Manage your channel, track video analytics, and monitor subscriber growth.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://youtube.com",
      docsUrl: "https://developers.google.com/youtube/v3",
      logoUrl: "/integrations/youtube.svg",
    },
    {
      name: "Pinterest",
      slug: "pinterest",
      description: "Visual discovery platform. Manage boards and pins, track engagement metrics, and analyze audience interests.",
      category: "SOCIAL_MEDIA" as const,
      websiteUrl: "https://pinterest.com",
      docsUrl: "https://developers.pinterest.com/docs/api/v5",
      logoUrl: "/integrations/pinterest.svg",
    },
    {
      name: "Klaviyo",
      slug: "klaviyo",
      description: "Email and SMS marketing automation platform. Create targeted campaigns and automate customer communications.",
      category: "MARKETING" as const,
      websiteUrl: "https://klaviyo.com",
      docsUrl: "https://developers.klaviyo.com",
      logoUrl: "/integrations/klaviyo.svg",
    },
    {
      name: "Slack",
      slug: "slack",
      description: "Team communication platform. Send notifications, alerts, and updates to your team channels.",
      category: "COMMUNICATION" as const,
      websiteUrl: "https://slack.com",
      docsUrl: "https://api.slack.com",
      logoUrl: "/integrations/slack.svg",
    },
    {
      name: "Airtable",
      slug: "airtable",
      description: "Cloud-based spreadsheet and database platform. Import tables with all data and media into ComeçaAI knowledge tables.",
      category: "OTHER" as const,
      websiteUrl: "https://airtable.com",
      docsUrl: "https://airtable.com/developers/web/api/introduction",
      logoUrl: "/integrations/airtable.svg",
    },
    {
      name: "Gorgias",
      slug: "gorgias",
      description: "Customer support helpdesk for e-commerce. Manage tickets, live chat, and customer conversations across all channels.",
      category: "SUPPORT" as const,
      websiteUrl: "https://www.gorgias.com",
      docsUrl: "https://developers.gorgias.com",
      logoUrl: "/integrations/gorgias.svg",
    },
    {
      name: "Intercom",
      slug: "intercom",
      description: "Customer messaging platform for sales, marketing, and support. Manage conversations, contacts, and help center content.",
      category: "SUPPORT" as const,
      websiteUrl: "https://www.intercom.com",
      docsUrl: "https://developers.intercom.com",
      logoUrl: "/integrations/intercom.svg",
    },
    {
      name: "Google Calendar",
      slug: "google-calendar",
      description: "Calendar and scheduling service. View calendars, manage events, check availability, and coordinate schedules.",
      category: "COMMUNICATION" as const,
      websiteUrl: "https://calendar.google.com",
      docsUrl: "https://developers.google.com/calendar",
      logoUrl: "/integrations/google-calendar.svg",
    },
    {
      name: "Gmail",
      slug: "gmail",
      description: "Email service by Google. Read and send emails, manage labels, drafts, and threads.",
      category: "COMMUNICATION" as const,
      websiteUrl: "https://mail.google.com",
      docsUrl: "https://developers.google.com/gmail/api",
      logoUrl: "/integrations/gmail.svg",
    },
    {
      name: "Plaud",
      slug: "plaud",
      description: "AI voice recorder. Import recordings, transcriptions, summaries, mind maps, and action items from your Plaud account.",
      category: "OTHER" as const,
      websiteUrl: "https://plaud.ai",
      docsUrl: "https://docs.plaud.ai",
      logoUrl: "/integrations/plaud.svg",
    },
    {
      name: "Microsoft Outlook",
      slug: "microsoft-outlook",
      description: "Calendar and email service by Microsoft. View calendars, manage events, check availability, and sync with Teams meetings.",
      category: "COMMUNICATION" as const,
      websiteUrl: "https://outlook.office.com",
      docsUrl: "https://learn.microsoft.com/en-us/graph/api/resources/calendar",
      logoUrl: "/integrations/microsoft-outlook.svg",
    },
    {
      name: "Zoom",
      slug: "zoom",
      description: "Video conferencing platform. View upcoming meetings, access recordings, and manage meeting schedules.",
      category: "COMMUNICATION" as const,
      websiteUrl: "https://zoom.us",
      docsUrl: "https://developers.zoom.us/docs/api/",
      logoUrl: "/integrations/zoom.svg",
    },
    {
      name: "Recall.ai",
      slug: "recall-ai",
      description: "Meeting bot infrastructure. Automatically join and record meetings across Zoom, Google Meet, Microsoft Teams, and Slack Huddles.",
      category: "OTHER" as const,
      websiteUrl: "https://recall.ai",
      docsUrl: "https://docs.recall.ai",
      logoUrl: "/integrations/recall-ai.svg",
    },
    {
      name: "Asana",
      slug: "asana",
      description: "Project management platform. Import tasks, projects, and assignments from your Asana workspace.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://asana.com",
      docsUrl: "https://developers.asana.com/docs",
      logoUrl: "/integrations/asana.svg",
    },
    {
      name: "Trello",
      slug: "trello",
      description: "Visual project management with boards and cards. Import cards and lists from your Trello boards.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://trello.com",
      docsUrl: "https://developer.atlassian.com/cloud/trello/",
      logoUrl: "/integrations/trello.svg",
    },
    {
      name: "Jira",
      slug: "jira",
      description: "Issue and project tracking for software teams. Import issues, sprints, and projects from Jira.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://www.atlassian.com/software/jira",
      docsUrl: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
      logoUrl: "/integrations/jira.svg",
    },
    {
      name: "Notion",
      slug: "notion",
      description: "All-in-one workspace. Import tasks and database entries from your Notion workspace.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://notion.so",
      docsUrl: "https://developers.notion.com",
      logoUrl: "/integrations/notion.svg",
    },
    {
      name: "Linear",
      slug: "linear",
      description: "Issue tracking for modern software teams. Import issues, projects, and cycles from Linear.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://linear.app",
      docsUrl: "https://developers.linear.app",
      logoUrl: "/integrations/linear.svg",
    },
    {
      name: "Monday.com",
      slug: "monday",
      description: "Work management platform. Import items and boards from your Monday.com workspace.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://monday.com",
      docsUrl: "https://developer.monday.com/api-reference/docs",
      logoUrl: "/integrations/monday.svg",
    },
    {
      name: "ClickUp",
      slug: "clickup",
      description: "Productivity platform. Import tasks, lists, and spaces from your ClickUp workspace.",
      category: "PROJECT_MANAGEMENT" as const,
      websiteUrl: "https://clickup.com",
      docsUrl: "https://clickup.com/api",
      logoUrl: "/integrations/clickup.svg",
    },
    // AI Model Providers
    {
      name: "OpenAI",
      slug: "openai",
      description: "AI model provider powering GPT-4, GPT-4o, and DALL-E. Use OpenAI models for content generation, analysis, and agent capabilities.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://openai.com",
      docsUrl: "https://platform.openai.com/docs",
      logoUrl: "/integrations/openai.svg",
    },
    {
      name: "Anthropic",
      slug: "anthropic",
      description: "AI model provider powering Claude. Use Anthropic models for reasoning, analysis, plan building, and agent capabilities throughout ComeçaAI.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://anthropic.com",
      docsUrl: "https://docs.anthropic.com",
      logoUrl: "/integrations/anthropic.svg",
    },
    {
      name: "Grok (xAI)",
      slug: "grok-xai",
      description: "AI model provider by xAI powering Grok. Use Grok models for real-time knowledge, content generation, and analysis.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://x.ai",
      docsUrl: "https://docs.x.ai",
      logoUrl: "/integrations/grok-xai.svg",
    },
    {
      name: "Meta Llama",
      slug: "meta-llama",
      description: "Open-source AI models by Meta. Use Llama models via API for content generation, analysis, and agent capabilities.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://ai.meta.com",
      docsUrl: "https://ai.meta.com/llama",
      logoUrl: "/integrations/meta-llama.svg",
    },
    {
      name: "ElevenLabs",
      slug: "elevenlabs",
      description: "AI voice synthesis and cloning platform. Generate natural-sounding speech, clone voices, and power voice agents with industry-leading quality.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://elevenlabs.io",
      docsUrl: "https://elevenlabs.io/docs/api-reference",
      logoUrl: "/integrations/elevenlabs.svg",
    },
    {
      name: "Stability AI",
      slug: "stability-ai",
      description: "Image generation with Stable Diffusion models. Create high-quality images, upscale, edit, and generate variations with powerful diffusion models.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://stability.ai",
      docsUrl: "https://platform.stability.ai/docs/api-reference",
      logoUrl: "/integrations/stability-ai.svg",
    },
    {
      name: "Runway",
      slug: "runway",
      description: "AI video generation platform. Create and edit videos with Gen-4 and Gen-3 Alpha models for professional-quality video content.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://runwayml.com",
      docsUrl: "https://docs.runwayml.com",
      logoUrl: "/integrations/runway.svg",
    },
    {
      name: "Replicate",
      slug: "replicate",
      description: "Run open-source AI models in the cloud. Access thousands of models including Flux, LLaMA, Whisper, and more through a unified API.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://replicate.com",
      docsUrl: "https://replicate.com/docs",
      logoUrl: "/integrations/replicate.svg",
    },
    {
      name: "Gamma",
      slug: "gamma",
      description: "AI-powered platform for creating presentations, documents, and visual content. Generate professional decks and pages with Gamma's creative AI.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://gamma.app",
      docsUrl: "https://gamma.app/docs",
      logoUrl: "/integrations/gamma.svg",
    },
    {
      name: "HeyGen",
      slug: "heygen",
      description: "AI avatar video generation platform. Create professional videos with V5 AI avatars, lip sync, and 300+ voices across 40+ languages.",
      category: "AI_MODELS" as const,
      websiteUrl: "https://heygen.com",
      docsUrl: "https://docs.heygen.com",
      logoUrl: "/integrations/heygen.svg",
    },
  ];

  for (const data of integrationData) {
    await prisma.integration.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        category: data.category,
        websiteUrl: data.websiteUrl,
        docsUrl: data.docsUrl,
        logoUrl: data.logoUrl,
      },
      create: data,
    });
  }
  console.log(`  Seeded ${integrationData.length} integrations`);

  // ========================
  // TABLES WE NEVER TOUCH:
  //   - FinancialSnapshot (user-created scenarios)
  //   - OpexCategory, OpexItem, OpexMilestone, OpexMilestoneLevel (user-created)
  // ========================

  // ========================
  // NETWORK: Rank Tiers
  // ========================
  console.log("Seeding rank tiers...");
  const bronze = await prisma.rankTier.upsert({
    where: { slug: "bronze" },
    update: {},
    create: {
      slug: "bronze",
      displayName: "Bronze",
      level: 1,
      color: "#CD7F32",
      qualificationRules: { min_points: 0, min_revenue: 0 },
      benefits: { commission_rate: 0.1, product_credit_bonus: 0 },
    },
  });
  await prisma.rankTier.upsert({
    where: { slug: "silver" },
    update: {},
    create: {
      slug: "silver",
      displayName: "Silver",
      level: 2,
      color: "#C0C0C0",
      qualificationRules: { min_points: 500, min_revenue: 2500, min_months_active: 2 },
      benefits: { commission_rate: 0.15, product_credit_bonus: 25 },
    },
  });
  await prisma.rankTier.upsert({
    where: { slug: "gold" },
    update: {},
    create: {
      slug: "gold",
      displayName: "Gold",
      level: 3,
      color: "#FFD700",
      qualificationRules: { min_points: 2000, min_revenue: 10000, min_referrals: 5, min_months_active: 6 },
      benefits: { commission_rate: 0.2, product_credit_bonus: 75, bonus_pool_eligible: true },
    },
  });
  console.log("  Seeded rank tiers");

  // ========================
  // ADMIN USER (as NetworkProfile)
  // ========================
  // Sub-etapa 3.6: NetworkProfileType + NetworkProfileRole removed.
  // Admin user is now plain identity; role derived from ADMIN_EMAIL env in auth.ts.
  console.log("Seeding admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || "nick@comecaai.com.br";
  await prisma.networkProfile.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "",
      email: adminEmail,
      status: "ACTIVE",
    },
  });
  console.log(`  Seeded admin user: ${adminEmail}`);

  // ========================
  // KNOWLEDGE APPS (fitness integrations)
  // ========================
  console.log("Seeding knowledge apps...");

  const knowledgeAppDefs = [
    {
      slug: "oura",
      name: "Oura Ring",
      description: "Sleep, activity, and readiness tracking from your Oura Ring.",
      logoUrl: "/images/apps/oura.svg",
      websiteUrl: "https://ouraring.com",
      category: "FITNESS" as const,
      authType: "oauth2",
      dataCategories: ["SLEEP", "ACTIVITY", "READINESS", "HEART_RATE"],
    },
    {
      slug: "whoop",
      name: "WHOOP",
      description: "Recovery, strain, sleep, and workout data from your WHOOP strap.",
      logoUrl: "/images/apps/whoop.svg",
      websiteUrl: "https://whoop.com",
      category: "FITNESS" as const,
      authType: "oauth2",
      dataCategories: ["SLEEP", "RECOVERY", "WORKOUT", "BODY", "HEART_RATE"],
    },
    {
      slug: "apple-health",
      name: "Apple Health",
      description: "Aggregated health data from Apple Health via Terra API bridge.",
      logoUrl: "/images/apps/apple-health.svg",
      websiteUrl: "https://www.apple.com/health/",
      category: "FITNESS" as const,
      authType: "oauth2",
      dataCategories: ["SLEEP", "ACTIVITY", "HEART_RATE", "WORKOUT", "BODY", "APP_NUTRITION"],
    },
  ];

  for (const app of knowledgeAppDefs) {
    await prisma.knowledgeApp.upsert({
      where: { slug: app.slug },
      update: {
        name: app.name,
        description: app.description,
        logoUrl: app.logoUrl,
        websiteUrl: app.websiteUrl,
        dataCategories: app.dataCategories,
      },
      create: {
        slug: app.slug,
        name: app.name,
        description: app.description,
        logoUrl: app.logoUrl,
        websiteUrl: app.websiteUrl,
        category: app.category,
        authType: app.authType,
        dataCategories: app.dataCategories,
        status: "PENDING",
      },
    });
    console.log(`  Seeded knowledge app: ${app.name}`);
  }

  // ========================
  // Departments (Org Structure)
  // ========================
  console.log("\n--- Seeding Departments ---");

  const executive = await prisma.department.upsert({
    where: { slug: "executive" },
    update: {},
    create: {
      name: "Executive",
      slug: "executive",
      description: "Executive leadership and C-suite",
      networkType: "INTERNAL",
      color: "#6366f1",
      icon: "crown",
      sortOrder: 0,
    },
  });
  console.log(`  Seeded department: Executive`);

  const deptData = [
    { name: "Sales", slug: "sales", description: "Sales team and business development", color: "#10b981", icon: "trending-up", sortOrder: 1 },
    { name: "Marketing", slug: "marketing", description: "Marketing, branding, and communications", color: "#ec4899", icon: "megaphone", sortOrder: 2 },
    { name: "Support", slug: "support", description: "Customer support and success", color: "#f59e0b", icon: "headphones", sortOrder: 3 },
    { name: "Operations", slug: "operations", description: "Business operations and logistics", color: "#8b5cf6", icon: "settings", sortOrder: 4 },
  ];

  const deptRecords: Record<string, { id: string }> = { executive };
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        ...d,
        networkType: "INTERNAL",
        parentId: executive.id,
      },
    });
    deptRecords[d.slug] = dept;
    console.log(`  Seeded department: ${d.name}`);
  }

  // Sub-teams under Sales
  const salesTeams = [
    { name: "Sales Team Alpha", slug: "sales-team-alpha", description: "Enterprise sales team", color: "#10b981", icon: "target", sortOrder: 0 },
    { name: "Sales Team Beta", slug: "sales-team-beta", description: "SMB and mid-market sales", color: "#06b6d4", icon: "target", sortOrder: 1 },
  ];

  for (const t of salesTeams) {
    await prisma.department.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        ...t,
        networkType: "INTERNAL",
        parentId: deptRecords.sales.id,
      },
    });
    console.log(`  Seeded sub-department: ${t.name}`);
  }

  // Assign admin profile as head of Executive if an admin profile exists
  const adminProfile = await prisma.networkProfile.findFirst({
    where: { email: adminEmail },
  });
  if (adminProfile) {
    await prisma.department.update({
      where: { id: executive.id },
      data: { headId: adminProfile.id },
    });
    // Also make them a member
    await prisma.departmentMember.upsert({
      where: { departmentId_profileId: { departmentId: executive.id, profileId: adminProfile.id } },
      update: {},
      create: {
        departmentId: executive.id,
        profileId: adminProfile.id,
        title: "CEO",
      },
    });
    console.log(`  Assigned admin as Executive department head`);
  }

  console.log("\nSeed completed successfully! No existing data was deleted.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
