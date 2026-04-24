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
        where: { sku: p.sku },
        update: { subCategory: p.subCategory }, // only patch subCategory onto existing rows
        create: { ...p },
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
        quarterlyPrice: 44.0,
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
        quarterlyPrice: 89.0,
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
        quarterlyPrice: 179.0,
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
        quarterlyPrice: 269.0,
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
        where: { slug: t.slug },
        update: {}, // don't overwrite user edits
        create: t.data,
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
  // COMMISSION STRUCTURE (find-or-create by name)
  // ========================
  console.log("Seeding commission structure...");

  let commissionStructure = await prisma.commissionStructure.findFirst({
    where: { name: "Launch 2026" },
  });

  if (!commissionStructure) {
    commissionStructure = await prisma.commissionStructure.create({
      data: {
        name: "Launch 2026",
        isActive: true,
        clawbackWindowDays: 60,
        residualPercent: 6.0,
        notes: "Initial commission structure for HERD D2D launch. Competitive flat bonuses with 6% monthly residual.",
      },
    });
    console.log("  Created commission structure");
  } else {
    console.log("  Commission structure already exists, skipping");
  }

  // Upsert tier rates by composite unique
  const tierRateDefs = [
    { tierId: starter.id, flatBonusAmount: 25.0 },
    { tierId: performance.id, flatBonusAmount: 50.0 },
    { tierId: elite.id, flatBonusAmount: 75.0 },
    { tierId: legend.id, flatBonusAmount: 100.0 },
  ];

  await Promise.all(
    tierRateDefs.map((r) =>
      prisma.commissionTierRate.upsert({
        where: {
          commissionStructureId_subscriptionTierId: {
            commissionStructureId: commissionStructure!.id,
            subscriptionTierId: r.tierId,
          },
        },
        update: {}, // don't overwrite user edits
        create: {
          commissionStructureId: commissionStructure!.id,
          subscriptionTierId: r.tierId,
          flatBonusAmount: r.flatBonusAmount,
          acceleratorThreshold: 1.5,
          acceleratorMultiplier: 1.5,
        },
      })
    )
  );

  console.log(`  Upserted ${tierRateDefs.length} commission tier rates`);

  // ========================
  // PARTNER BRANDS (find-or-create by name)
  // ========================
  console.log("Seeding partner brands...");

  const partnerDefs = [
    { name: "FitLife Gym", discountDescription: "Discounted gym memberships for HERD members", websiteUrl: "https://fitlifegym.example.com", isActive: true, kickbackType: "FLAT_PER_REFERRAL", kickbackValue: 5.0, category: "Gym" },
    { name: "CleanEats Meal Prep", discountDescription: "Healthy meal prep delivered to your door at a discount", websiteUrl: "https://cleaneats.example.com", isActive: true, kickbackType: "PERCENT_OF_SALE", kickbackValue: 8.0, category: "Meal Prep" },
    { name: "ZenRecovery App", discountDescription: "Premium meditation and recovery app subscription", websiteUrl: "https://zenrecovery.example.com", isActive: true, kickbackType: "FLAT_PER_MONTH", kickbackValue: 2.0, category: "Wellness App" },
    { name: "IronGrip Equipment", discountDescription: "Home gym equipment and accessories at member prices", websiteUrl: "https://irongrip.example.com", isActive: true, kickbackType: "PERCENT_OF_SALE", kickbackValue: 5.0, category: "Equipment" },
    { name: "FlexWear Athletic", discountDescription: "Premium athletic wear from a complementary brand", websiteUrl: "https://flexwear.example.com", isActive: true, kickbackType: "NONE", kickbackValue: null, category: "Apparel" },
    { name: "SleepDeep Supplements", discountDescription: "Sleep and recovery supplements from SleepDeep", websiteUrl: "https://sleepdeep.example.com", isActive: true, kickbackType: "FLAT_PER_REFERRAL", kickbackValue: 3.0, category: "Recovery" },
  ];

  const partners = await Promise.all(
    partnerDefs.map(async (p) => {
      let partner = await prisma.partnerBrand.findFirst({ where: { name: p.name } });
      if (!partner) {
        partner = await prisma.partnerBrand.create({ data: p });
      }
      return partner;
    })
  );

  const [fitlife, cleaneats, zenrecovery, irongrip, flexwear, sleepdeep] = partners;
  console.log(`  Upserted ${partners.length} partner brands`);

  // ========================
  // PARTNER TIER ASSIGNMENTS (upsert by composite unique)
  // ========================
  console.log("Seeding partner tier assignments...");

  const partnerAssignments = [
    { partnerId: fitlife.id, tierId: starter.id, discountPercent: 10 },
    { partnerId: fitlife.id, tierId: performance.id, discountPercent: 15 },
    { partnerId: fitlife.id, tierId: elite.id, discountPercent: 20 },
    { partnerId: fitlife.id, tierId: legend.id, discountPercent: 30 },
    { partnerId: cleaneats.id, tierId: performance.id, discountPercent: 10 },
    { partnerId: cleaneats.id, tierId: elite.id, discountPercent: 15 },
    { partnerId: cleaneats.id, tierId: legend.id, discountPercent: 20 },
    { partnerId: zenrecovery.id, tierId: starter.id, discountPercent: 10 },
    { partnerId: zenrecovery.id, tierId: performance.id, discountPercent: 10 },
    { partnerId: zenrecovery.id, tierId: elite.id, discountPercent: 15 },
    { partnerId: zenrecovery.id, tierId: legend.id, discountPercent: 20 },
    { partnerId: irongrip.id, tierId: elite.id, discountPercent: 10 },
    { partnerId: irongrip.id, tierId: legend.id, discountPercent: 15 },
    { partnerId: flexwear.id, tierId: performance.id, discountPercent: 10 },
    { partnerId: flexwear.id, tierId: elite.id, discountPercent: 15 },
    { partnerId: flexwear.id, tierId: legend.id, discountPercent: 20 },
    { partnerId: sleepdeep.id, tierId: starter.id, discountPercent: 10 },
    { partnerId: sleepdeep.id, tierId: performance.id, discountPercent: 10 },
    { partnerId: sleepdeep.id, tierId: elite.id, discountPercent: 15 },
    { partnerId: sleepdeep.id, tierId: legend.id, discountPercent: 20 },
  ];

  await Promise.all(
    partnerAssignments.map((a) =>
      prisma.partnerTierAssignment.upsert({
        where: {
          partnerBrandId_subscriptionTierId: {
            partnerBrandId: a.partnerId,
            subscriptionTierId: a.tierId,
          },
        },
        update: {}, // don't overwrite user edits
        create: {
          partnerBrandId: a.partnerId,
          subscriptionTierId: a.tierId,
          discountPercent: a.discountPercent,
          isActive: true,
        },
      })
    )
  );

  console.log(`  Upserted ${partnerAssignments.length} partner tier assignments`);

  // ========================
  // AFFILIATE PARTNER BRANDS (48+ researched partners)
  // ========================
  console.log("Seeding affiliate partner brands...");

  const { partnerBrandsSeedData } = await import("./data/partner-brands");

  let affiliateCreated = 0;
  for (const p of partnerBrandsSeedData) {
    const existing = await prisma.partnerBrand.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.partnerBrand.create({ data: p });
      affiliateCreated++;
    }
  }

  console.log(`  Created ${affiliateCreated} new affiliate partners (${partnerBrandsSeedData.length - affiliateCreated} already existed)`);

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
  // D2D PARTNERS (find-or-create by name)
  // ========================
  console.log("Seeding D2D partners...");

  const d2dPartnerDefs = [
    { name: "Apex Door Knockers", contactName: "Marcus Rivera", contactEmail: "marcus@apexdk.example.com", contactPhone: "801-555-0101", notes: "Top-performing D2D partner. Based in Utah, expanding into Arizona and Nevada." },
    { name: "Summit Sales Group", contactName: "Jessica Chen", contactEmail: "jchen@summitsales.example.com", contactPhone: "480-555-0202", notes: "Large team operating across the Southwest. Strong in college markets." },
    { name: "Trailblazer D2D", contactName: "Kyle Thompson", contactEmail: "kyle@trailblazerd2d.example.com", contactPhone: "303-555-0303", notes: "Smaller boutique partner. New agreement being negotiated." },
  ];

  const d2dPartners = await Promise.all(
    d2dPartnerDefs.map(async (p) => {
      let partner = await prisma.d2DPartner.findFirst({ where: { name: p.name } });
      if (!partner) {
        partner = await prisma.d2DPartner.create({ data: p });
      }
      return partner;
    })
  );

  const [apex, summit, trailblazer] = d2dPartners;
  console.log(`  Upserted ${d2dPartners.length} D2D partners`);

  // ========================
  // ORG TREES (find-or-create)
  // ========================
  console.log("Seeding org trees...");

  async function seedOrgTree(partnerId: string, tree: { name: string; roleType: "REGIONAL_LEADER" | "TEAM_LEAD" | "REP"; email?: string; children?: { name: string; roleType: "REGIONAL_LEADER" | "TEAM_LEAD" | "REP"; email?: string; children?: { name: string; roleType: "REGIONAL_LEADER" | "TEAM_LEAD" | "REP"; email?: string }[] }[] }): Promise<string[]> {
    const ids: string[] = [];
    // Create root
    let root = await prisma.orgNode.findFirst({ where: { d2dPartnerId: partnerId, name: tree.name, roleType: tree.roleType } });
    if (!root) {
      root = await prisma.orgNode.create({ data: { d2dPartnerId: partnerId, name: tree.name, roleType: tree.roleType, email: tree.email, hireDate: new Date("2025-09-01") } });
    }
    ids.push(root.id);
    // Create children (Team Leads)
    if (tree.children) {
      for (const child of tree.children) {
        let node = await prisma.orgNode.findFirst({ where: { d2dPartnerId: partnerId, name: child.name, roleType: child.roleType } });
        if (!node) {
          node = await prisma.orgNode.create({ data: { d2dPartnerId: partnerId, parentId: root.id, name: child.name, roleType: child.roleType, email: child.email, hireDate: new Date("2025-10-01") } });
        }
        ids.push(node.id);
        // Create grandchildren (Reps)
        if (child.children) {
          for (const rep of child.children) {
            let repNode = await prisma.orgNode.findFirst({ where: { d2dPartnerId: partnerId, name: rep.name, roleType: rep.roleType } });
            if (!repNode) {
              repNode = await prisma.orgNode.create({ data: { d2dPartnerId: partnerId, parentId: node.id, name: rep.name, roleType: rep.roleType, email: rep.email, hireDate: new Date("2025-11-01") } });
            }
            ids.push(repNode.id);
          }
        }
      }
    }
    return ids;
  }

  const apexNodeIds = await seedOrgTree(apex.id, {
    name: "Marcus Rivera", roleType: "REGIONAL_LEADER", email: "marcus@apexdk.example.com",
    children: [
      { name: "Jake Martinez", roleType: "TEAM_LEAD", email: "jake@apexdk.example.com", children: [
        { name: "Dylan Brooks", roleType: "REP" }, { name: "Aiden Torres", roleType: "REP" },
        { name: "Caleb Ward", roleType: "REP" }, { name: "Mason Hughes", roleType: "REP" },
        { name: "Ethan Price", roleType: "REP" },
      ]},
      { name: "Sofia Ramirez", roleType: "TEAM_LEAD", email: "sofia@apexdk.example.com", children: [
        { name: "Liam Foster", roleType: "REP" }, { name: "Noah Bell", roleType: "REP" },
        { name: "Emma Cooper", roleType: "REP" }, { name: "Olivia Reed", roleType: "REP" },
        { name: "Ava Mitchell", roleType: "REP" },
      ]},
    ],
  });

  const summitNodeIds = await seedOrgTree(summit.id, {
    name: "Jessica Chen", roleType: "REGIONAL_LEADER", email: "jchen@summitsales.example.com",
    children: [
      { name: "Ryan Park", roleType: "TEAM_LEAD", email: "rpark@summitsales.example.com", children: [
        { name: "Tyler Kim", roleType: "REP" }, { name: "Brandon Lee", roleType: "REP" },
        { name: "Justin Tran", roleType: "REP" }, { name: "Kevin Nguyen", roleType: "REP" },
      ]},
      { name: "Ashley Morgan", roleType: "TEAM_LEAD", email: "amorgan@summitsales.example.com", children: [
        { name: "Brittany Hayes", roleType: "REP" }, { name: "Megan Scott", roleType: "REP" },
        { name: "Hannah Young", roleType: "REP" }, { name: "Rachel Adams", roleType: "REP" },
      ]},
      { name: "Derek Johnson", roleType: "TEAM_LEAD", email: "djohnson@summitsales.example.com", children: [
        { name: "Chris Evans", roleType: "REP" }, { name: "Matt Wilson", roleType: "REP" },
        { name: "James Taylor", roleType: "REP" }, { name: "Andrew Clark", roleType: "REP" },
      ]},
    ],
  });

  const trailblazerNodeIds = await seedOrgTree(trailblazer.id, {
    name: "Kyle Thompson", roleType: "REGIONAL_LEADER", email: "kyle@trailblazerd2d.example.com",
    children: [
      { name: "Sarah Davis", roleType: "TEAM_LEAD", email: "sarah@trailblazerd2d.example.com", children: [
        { name: "Mike Brown", roleType: "REP" }, { name: "Lisa Green", roleType: "REP" },
        { name: "Tom White", roleType: "REP" },
      ]},
    ],
  });

  console.log(`  Seeded org trees: Apex (${apexNodeIds.length}), Summit (${summitNodeIds.length}), Trailblazer (${trailblazerNodeIds.length})`);

  // ========================
  // COMMISSION PLANS (find-or-create by name+version)
  // ========================
  console.log("Seeding commission plans...");

  let launchPlan = await prisma.commissionPlan.findFirst({ where: { name: "Launch 2026", version: 1 } });
  if (!launchPlan) {
    launchPlan = await prisma.commissionPlan.create({
      data: {
        name: "Launch 2026",
        version: 1,
        isActive: true,
        effectiveFrom: new Date("2026-01-01"),
        residualPercent: 6.0,
        legacyStructureId: commissionStructure?.id ?? null,
        notes: "Primary D2D commission plan for 2026 launch. Competitive flat bonuses with 6% monthly residual.",
      },
    });
  }

  let summerPlan = await prisma.commissionPlan.findFirst({ where: { name: "Summer Push 2026", version: 1 } });
  if (!summerPlan) {
    summerPlan = await prisma.commissionPlan.create({
      data: {
        name: "Summer Push 2026",
        version: 1,
        isActive: false,
        effectiveFrom: new Date("2026-06-01"),
        effectiveTo: new Date("2026-08-31"),
        residualPercent: 5.0,
        notes: "Higher upfront bonuses for summer seasonal push. Slightly lower residual to offset.",
      },
    });
  }

  console.log("  Seeded 2 commission plans");

  // ========================
  // COMMISSION PLAN RATES (per tier, per role)
  // ========================
  console.log("Seeding commission plan rates...");

  const tiers = [starter, performance, elite, legend];
  const tierBonuses: Record<string, { REP: number; TEAM_LEAD: number; REGIONAL_LEADER: number }> = {
    [starter.id]: { REP: 25, TEAM_LEAD: 0, REGIONAL_LEADER: 0 },
    [performance.id]: { REP: 50, TEAM_LEAD: 0, REGIONAL_LEADER: 0 },
    [elite.id]: { REP: 75, TEAM_LEAD: 0, REGIONAL_LEADER: 0 },
    [legend.id]: { REP: 100, TEAM_LEAD: 0, REGIONAL_LEADER: 0 },
  };

  for (const tier of tiers) {
    for (const roleType of ["REP", "TEAM_LEAD", "REGIONAL_LEADER"] as const) {
      await prisma.commissionPlanRate.upsert({
        where: { commissionPlanId_subscriptionTierId_roleType: { commissionPlanId: launchPlan.id, subscriptionTierId: tier.id, roleType } },
        update: {},
        create: {
          commissionPlanId: launchPlan.id,
          subscriptionTierId: tier.id,
          roleType,
          upfrontBonus: tierBonuses[tier.id][roleType],
          residualPercent: roleType === "REP" ? 6.0 : roleType === "TEAM_LEAD" ? 1.0 : 0.5,
        },
      });
    }
  }

  // Summer plan rates (higher bonuses)
  const summerBonuses: Record<string, number> = {
    [starter.id]: 35, [performance.id]: 65, [elite.id]: 100, [legend.id]: 135,
  };
  for (const tier of tiers) {
    for (const roleType of ["REP", "TEAM_LEAD", "REGIONAL_LEADER"] as const) {
      await prisma.commissionPlanRate.upsert({
        where: { commissionPlanId_subscriptionTierId_roleType: { commissionPlanId: summerPlan.id, subscriptionTierId: tier.id, roleType } },
        update: {},
        create: {
          commissionPlanId: summerPlan.id,
          subscriptionTierId: tier.id,
          roleType,
          upfrontBonus: roleType === "REP" ? summerBonuses[tier.id] : 0,
          residualPercent: roleType === "REP" ? 5.0 : roleType === "TEAM_LEAD" ? 1.0 : 0.5,
        },
      });
    }
  }

  console.log("  Seeded plan rates for both plans");

  // ========================
  // OVERRIDE RULES
  // ========================
  console.log("Seeding override rules...");

  for (const plan of [launchPlan, summerPlan]) {
    await prisma.overrideRule.upsert({
      where: { commissionPlanId_roleType: { commissionPlanId: plan.id, roleType: "TEAM_LEAD" } },
      update: {},
      create: { commissionPlanId: plan.id, roleType: "TEAM_LEAD", overrideType: "FLAT", overrideValue: 5.0, notes: "$5 flat override per sale by any downline rep" },
    });
    await prisma.overrideRule.upsert({
      where: { commissionPlanId_roleType: { commissionPlanId: plan.id, roleType: "REGIONAL_LEADER" } },
      update: {},
      create: { commissionPlanId: plan.id, roleType: "REGIONAL_LEADER", overrideType: "FLAT", overrideValue: 3.0, notes: "$3 flat override per sale by any downline rep" },
    });
  }

  console.log("  Seeded override rules for both plans");

  // ========================
  // PERFORMANCE TIERS (Accelerators)
  // ========================
  console.log("Seeding performance tiers...");

  const perfTierDefs = [
    { label: "Bronze", minSales: 0, maxSales: 9, bonusMultiplier: 1.0, bonusFlat: 0, sortOrder: 0 },
    { label: "Silver", minSales: 10, maxSales: 19, bonusMultiplier: 1.15, bonusFlat: 0, sortOrder: 1 },
    { label: "Gold", minSales: 20, maxSales: 29, bonusMultiplier: 1.35, bonusFlat: 0, sortOrder: 2 },
    { label: "Platinum", minSales: 30, maxSales: null, bonusMultiplier: 1.5, bonusFlat: 50, sortOrder: 3 },
  ];

  for (const pt of perfTierDefs) {
    const existing = await prisma.performanceTier.findFirst({
      where: { commissionPlanId: launchPlan.id, label: pt.label },
    });
    if (!existing) {
      await prisma.performanceTier.create({
        data: { commissionPlanId: launchPlan.id, ...pt },
      });
    }
  }

  console.log("  Seeded 4 performance tiers for Launch 2026");

  // ========================
  // PARTNER AGREEMENTS
  // ========================
  console.log("Seeding partner agreements...");

  let apexAgreement = await prisma.partnerAgreement.findFirst({ where: { d2dPartnerId: apex.id, name: "Apex — Launch 2026" } });
  if (!apexAgreement) {
    apexAgreement = await prisma.partnerAgreement.create({
      data: {
        d2dPartnerId: apex.id, commissionPlanId: launchPlan.id,
        name: "Apex — Launch 2026", status: "ACTIVE",
        effectiveFrom: new Date("2026-01-01"),
        payoutCadence: "MONTHLY", holdPeriodDays: 30,
        notes: "Standard launch terms. Monthly payout with 30-day hold.",
      },
    });
  }

  let summitAgreement = await prisma.partnerAgreement.findFirst({ where: { d2dPartnerId: summit.id, name: "Summit — Launch 2026" } });
  if (!summitAgreement) {
    summitAgreement = await prisma.partnerAgreement.create({
      data: {
        d2dPartnerId: summit.id, commissionPlanId: launchPlan.id,
        name: "Summit — Launch 2026", status: "ACTIVE",
        effectiveFrom: new Date("2026-01-01"),
        payoutCadence: "BIWEEKLY", holdPeriodDays: 14,
        notes: "Negotiated biweekly payout with shorter hold period due to team size.",
      },
    });
  }

  let trailblazerAgreement = await prisma.partnerAgreement.findFirst({ where: { d2dPartnerId: trailblazer.id, name: "Trailblazer — Summer 2026" } });
  if (!trailblazerAgreement) {
    trailblazerAgreement = await prisma.partnerAgreement.create({
      data: {
        d2dPartnerId: trailblazer.id, commissionPlanId: summerPlan.id,
        name: "Trailblazer — Summer 2026", status: "DRAFT",
        effectiveFrom: new Date("2026-06-01"), effectiveTo: new Date("2026-08-31"),
        payoutCadence: "MONTHLY", holdPeriodDays: 30,
        notes: "Draft agreement for summer push. Pending final approval.",
      },
    });
  }

  console.log("  Seeded 3 partner agreements");

  // ========================
  // CLAWBACK RULES
  // ========================
  console.log("Seeding clawback rules...");

  const clawbackDefs = [
    { agreementId: apexAgreement.id, rules: [{ windowDays: 30, clawbackPercent: 100 }, { windowDays: 60, clawbackPercent: 50 }, { windowDays: 90, clawbackPercent: 25 }] },
    { agreementId: summitAgreement.id, rules: [{ windowDays: 30, clawbackPercent: 100 }, { windowDays: 60, clawbackPercent: 75 }] },
    { agreementId: trailblazerAgreement.id, rules: [{ windowDays: 30, clawbackPercent: 100 }] },
  ];

  for (const def of clawbackDefs) {
    for (const rule of def.rules) {
      await prisma.clawbackRule.upsert({
        where: { agreementId_windowDays: { agreementId: def.agreementId, windowDays: rule.windowDays } },
        update: {},
        create: { agreementId: def.agreementId, windowDays: rule.windowDays, clawbackPercent: rule.clawbackPercent },
      });
    }
  }

  console.log("  Seeded clawback rules for all agreements");

  // ========================
  // SAMPLE COMMISSION LEDGER ENTRIES
  // ========================
  console.log("Seeding sample ledger entries...");

  const existingLedger = await prisma.commissionLedgerEntry.count();
  if (existingLedger === 0) {
    // Pick some rep node IDs for entries
    const apexReps = await prisma.orgNode.findMany({ where: { d2dPartnerId: apex.id, roleType: "REP" }, take: 4 });
    const summitReps = await prisma.orgNode.findMany({ where: { d2dPartnerId: summit.id, roleType: "REP" }, take: 3 });
    const apexTLs = await prisma.orgNode.findMany({ where: { d2dPartnerId: apex.id, roleType: "TEAM_LEAD" }, take: 2 });
    const apexRL = await prisma.orgNode.findFirst({ where: { d2dPartnerId: apex.id, roleType: "REGIONAL_LEADER" } });

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const ledgerEntries = [
      // Apex reps — earned upfront bonuses
      { orgNodeId: apexReps[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 50, subscriptionTierId: performance.id, description: "Upfront bonus — Performance tier sale", createdAt: daysAgo(60) },
      { orgNodeId: apexReps[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 75, subscriptionTierId: elite.id, description: "Upfront bonus — Elite tier sale", createdAt: daysAgo(45) },
      { orgNodeId: apexReps[1]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 25, subscriptionTierId: starter.id, description: "Upfront bonus — Starter tier sale", createdAt: daysAgo(40) },
      { orgNodeId: apexReps[2]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 100, subscriptionTierId: legend.id, description: "Upfront bonus — Legend tier sale", createdAt: daysAgo(35) },
      // Team Lead overrides
      { orgNodeId: apexTLs[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "OVERRIDE" as const, amount: 5, description: "Team Lead override — rep sale", createdAt: daysAgo(60) },
      { orgNodeId: apexTLs[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "OVERRIDE" as const, amount: 5, description: "Team Lead override — rep sale", createdAt: daysAgo(45) },
      { orgNodeId: apexTLs[1]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "OVERRIDE" as const, amount: 5, description: "Team Lead override — rep sale", createdAt: daysAgo(35) },
      // Regional Leader override
      { orgNodeId: apexRL?.id!, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "OVERRIDE" as const, amount: 3, description: "Regional Leader override — rep sale", createdAt: daysAgo(60) },
      // Residual entries
      { orgNodeId: apexReps[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "RESIDUAL" as const, amount: 5.94, subscriptionTierId: performance.id, periodStart: daysAgo(30), periodEnd: daysAgo(0), description: "Monthly residual — Performance tier", createdAt: daysAgo(5) },
      { orgNodeId: apexReps[0]?.id, agreementId: apexAgreement.id, entryType: "EARNED" as const, source: "RESIDUAL" as const, amount: 11.94, subscriptionTierId: elite.id, periodStart: daysAgo(30), periodEnd: daysAgo(0), description: "Monthly residual — Elite tier", createdAt: daysAgo(5) },
      // Held entries
      { orgNodeId: apexReps[3]?.id, agreementId: apexAgreement.id, entryType: "HELD" as const, source: "UPFRONT_BONUS" as const, amount: 50, subscriptionTierId: performance.id, description: "Held — within 30-day hold period", createdAt: daysAgo(10) },
      // Released entry
      { orgNodeId: apexReps[0]?.id, agreementId: apexAgreement.id, entryType: "RELEASED" as const, source: "UPFRONT_BONUS" as const, amount: 50, description: "Released — hold period cleared", createdAt: daysAgo(25) },
      // Clawback
      { orgNodeId: apexReps[1]?.id, agreementId: apexAgreement.id, entryType: "CLAWED_BACK" as const, source: "CLAWBACK" as const, amount: -25, subscriptionTierId: starter.id, description: "Full clawback — customer cancelled within 30 days", createdAt: daysAgo(15) },
      // Summit entries
      { orgNodeId: summitReps[0]?.id, agreementId: summitAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 50, subscriptionTierId: performance.id, description: "Upfront bonus — Performance tier sale", createdAt: daysAgo(20) },
      { orgNodeId: summitReps[1]?.id, agreementId: summitAgreement.id, entryType: "EARNED" as const, source: "UPFRONT_BONUS" as const, amount: 75, subscriptionTierId: elite.id, description: "Upfront bonus — Elite tier sale", createdAt: daysAgo(18) },
      { orgNodeId: summitReps[2]?.id, agreementId: summitAgreement.id, entryType: "HELD" as const, source: "UPFRONT_BONUS" as const, amount: 100, subscriptionTierId: legend.id, description: "Held — within 14-day hold period", createdAt: daysAgo(5) },
    ];

    // Filter out entries where orgNodeId might be undefined (if tree seeding was skipped)
    const validEntries = ledgerEntries.filter(e => e.orgNodeId);

    for (const entry of validEntries) {
      await prisma.commissionLedgerEntry.create({ data: entry });
    }

    console.log(`  Seeded ${validEntries.length} ledger entries`);
  } else {
    console.log(`  Ledger already has ${existingLedger} entries, skipping`);
  }

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
      description: "Subscription billing and recurring payments platform. Connect to sync subscription plans with HERD tiers, manage charges, and automate billing workflows.",
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
      description: "Cloud-based spreadsheet and database platform. Import tables with all data and media into HERD knowledge tables.",
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
      description: "AI model provider powering Claude. Use Anthropic models for reasoning, analysis, plan building, and agent capabilities throughout HERD.",
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
  // NETWORK: Compensation Plans
  // ========================
  console.log("\nSeeding network compensation plans...");
  const standardNetworkPlan = await prisma.networkCompensationPlan.upsert({
    where: { slug: "standard" },
    update: {},
    create: {
      slug: "standard",
      name: "Standard Plan",
      commissionRules: {
        type: "tiered",
        tiers: [
          { minRevenue: 0, rate: 0.1 },
          { minRevenue: 5000, rate: 0.12 },
          { minRevenue: 10000, rate: 0.15 },
        ],
      },
      bonusRules: { referralBonus: 50, monthlyActivityBonus: 25 },
      pointsRules: { pointsPerDollar: 1, referralPoints: 100, trainingCompletionPoints: 50 },
    },
  });
  console.log("  Seeded network compensation plans");

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
  // NETWORK: Profile Types
  // ========================
  console.log("Seeding network profile types...");
  const internalProfileTypes = [
    { slug: "admin", displayName: "Administrator", icon: "shield", color: "#6366f1", wizardFields: [] },
    { slug: "manager", displayName: "Regional Manager", icon: "briefcase", color: "#8b5cf6", wizardFields: [{ key: "territory", label: "Territory", type: "text", required: true, step: 6, target: "attribute", placeholder: "e.g., Southwest Region" }] },
    { slug: "team_lead", displayName: "Team Lead", icon: "users", color: "#06b6d4", wizardFields: [{ key: "team_size", label: "Target Team Size", type: "number", required: false, step: 6, target: "attribute" }] },
    { slug: "sales_rep", displayName: "Sales Representative", icon: "trending-up", color: "#10b981", wizardFields: [{ key: "sales_channel", label: "Primary Sales Channel", type: "select", required: true, step: 6, target: "attribute", options: ["Direct", "Online", "Retail", "Events"] }] },
    { slug: "support", displayName: "Support Staff", icon: "headphones", color: "#f59e0b", wizardFields: [{ key: "department", label: "Department", type: "select", required: true, step: 6, target: "attribute", options: ["Customer Service", "Technical Support", "Operations"] }] },
  ];
  const externalProfileTypes = [
    { slug: "promoter", displayName: "Brand Promoter", icon: "megaphone", color: "#FF0000", wizardFields: [{ key: "primary_channel", label: "Primary Promotion Channel", type: "select", required: true, step: 6, target: "attribute", options: ["In-Store", "Events", "Online", "Gym"] }, { key: "location", label: "Primary Location / City", type: "text", required: true, step: 6, target: "attribute" }] },
    { slug: "influencer", displayName: "Social Influencer", icon: "star", color: "#ec4899", wizardFields: [{ key: "instagram_handle", label: "Instagram Handle", type: "text", required: false, step: 6, target: "attribute", placeholder: "@handle" }, { key: "tiktok_handle", label: "TikTok Handle", type: "text", required: false, step: 6, target: "attribute", placeholder: "@handle" }, { key: "follower_count", label: "Total Follower Count", type: "number", required: true, step: 6, target: "attribute" }, { key: "content_niche", label: "Content Niche", type: "select", required: true, step: 6, target: "attribute", options: ["Fitness", "Bodybuilding", "Lifestyle", "Nutrition", "Sports", "Other"] }] },
    { slug: "trainer", displayName: "Personal Trainer", icon: "dumbbell", color: "#f97316", wizardFields: [{ key: "certifications", label: "Certifications", type: "multi_select", required: false, step: 6, target: "attribute", options: ["NASM-CPT", "ACE", "ISSA", "NSCA-CPT", "ACSM", "Other"] }, { key: "gym_affiliation", label: "Gym / Facility", type: "text", required: false, step: 6, target: "attribute" }, { key: "specialties", label: "Training Specialties", type: "multi_select", required: false, step: 6, target: "attribute", options: ["Strength", "Cardio", "HIIT", "Powerlifting", "CrossFit", "Weight Loss", "Muscle Building"] }] },
    { slug: "nutritionist", displayName: "Nutritionist", icon: "apple", color: "#22c55e", wizardFields: [{ key: "credentials", label: "Credentials", type: "multi_select", required: false, step: 6, target: "attribute", options: ["RD", "RDN", "CDN", "CSSD", "CNS", "Other"] }, { key: "specialization", label: "Specialization", type: "select", required: false, step: 6, target: "attribute", options: ["Sports Nutrition", "Clinical", "Weight Management", "General Wellness"] }] },
    { slug: "gym_partner", displayName: "Gym Partner", icon: "building", color: "#64748b", wizardFields: [{ key: "gym_name", label: "Gym / Facility Name", type: "text", required: true, step: 6, target: "attribute" }, { key: "gym_type", label: "Gym Type", type: "select", required: true, step: 6, target: "attribute", options: ["Commercial Gym", "CrossFit Box", "Boutique Studio", "University Rec Center", "Other"] }, { key: "member_count", label: "Approximate Member Count", type: "number", required: false, step: 6, target: "attribute" }] },
  ];
  for (const [i, t] of internalProfileTypes.entries()) {
    await prisma.networkProfileType.upsert({
      where: { slug: t.slug },
      update: {},
      create: { ...t, networkType: "INTERNAL", sortOrder: i },
    });
  }
  for (const [i, t] of externalProfileTypes.entries()) {
    await prisma.networkProfileType.upsert({
      where: { slug: t.slug },
      update: {},
      create: { ...t, networkType: "EXTERNAL", sortOrder: i, defaultCompPlanId: standardNetworkPlan.id, defaultRankId: bronze.id },
    });
  }
  console.log("  Seeded network profile types");

  // ========================
  // NETWORK: Permissions
  // ========================
  console.log("Seeding network permissions...");
  const networkPermDefs = [
    { resource: "profiles", actions: ["view", "create", "edit", "delete", "export"] },
    { resource: "network", actions: ["view_internal", "view_external", "manage_hierarchy"] },
    { resource: "commissions", actions: ["view", "configure", "approve", "export"] },
    { resource: "ranks", actions: ["view", "configure", "evaluate"] },
    { resource: "points", actions: ["view", "adjust", "export"] },
    { resource: "reports", actions: ["view", "create", "export"] },
    { resource: "teams", actions: ["view", "create", "edit", "delete"] },
    { resource: "settings", actions: ["view", "edit"] },
  ];
  const networkPermMap: Record<string, string> = {};
  for (const { resource, actions } of networkPermDefs) {
    for (const action of actions) {
      const perm = await prisma.networkPermission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
      networkPermMap[`${resource}:${action}`] = perm.id;
    }
  }
  console.log("  Seeded network permissions");

  // ========================
  // NETWORK: Roles
  // ========================
  console.log("Seeding network roles...");
  const superAdmin = await prisma.networkRole.upsert({
    where: { slug: "super_admin" },
    update: {},
    create: { slug: "super_admin", displayName: "Super Admin", description: "Full system access", isSystem: true },
  });
  await prisma.networkRole.upsert({
    where: { slug: "org_admin" },
    update: {},
    create: { slug: "org_admin", displayName: "Org Admin", description: "Organization-level admin", networkType: "INTERNAL", parentRoleId: superAdmin.id, isSystem: true },
  });
  const regionalMgr = await prisma.networkRole.upsert({
    where: { slug: "regional_manager" },
    update: {},
    create: { slug: "regional_manager", displayName: "Regional Manager", networkType: "INTERNAL" },
  });
  const teamLeadRole = await prisma.networkRole.upsert({
    where: { slug: "team_lead" },
    update: {},
    create: { slug: "team_lead", displayName: "Team Lead", networkType: "INTERNAL", parentRoleId: regionalMgr.id },
  });
  await prisma.networkRole.upsert({
    where: { slug: "field_rep" },
    update: {},
    create: { slug: "field_rep", displayName: "Field Rep", networkType: "INTERNAL", parentRoleId: teamLeadRole.id },
  });
  const extGold = await prisma.networkRole.upsert({
    where: { slug: "external_gold" },
    update: {},
    create: { slug: "external_gold", displayName: "External Gold", networkType: "EXTERNAL" },
  });
  const extSilver = await prisma.networkRole.upsert({
    where: { slug: "external_silver" },
    update: {},
    create: { slug: "external_silver", displayName: "External Silver", networkType: "EXTERNAL", parentRoleId: extGold.id },
  });
  await prisma.networkRole.upsert({
    where: { slug: "external_bronze" },
    update: {},
    create: { slug: "external_bronze", displayName: "External Bronze", networkType: "EXTERNAL", parentRoleId: extSilver.id },
  });
  console.log("  Seeded network roles");

  // ========================
  // NETWORK: Role Permissions
  // ========================
  console.log("Seeding network role permissions...");
  // Super admin gets all
  for (const permId of Object.values(networkPermMap)) {
    await prisma.networkRolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: permId } },
      update: {},
      create: { roleId: superAdmin.id, permissionId: permId },
    });
  }
  // Regional manager — view/edit profiles, network, teams
  for (const key of ["profiles:view", "profiles:create", "profiles:edit", "network:view_internal", "network:view_external", "network:manage_hierarchy", "commissions:view", "reports:view", "reports:create", "teams:view", "teams:create", "teams:edit"]) {
    if (networkPermMap[key]) {
      await prisma.networkRolePermission.upsert({
        where: { roleId_permissionId: { roleId: regionalMgr.id, permissionId: networkPermMap[key] } },
        update: {},
        create: { roleId: regionalMgr.id, permissionId: networkPermMap[key] },
      });
    }
  }
  // External gold — view commissions, points, ranks, profiles, reports
  for (const key of ["commissions:view", "points:view", "ranks:view", "profiles:view", "reports:view"]) {
    if (networkPermMap[key]) {
      await prisma.networkRolePermission.upsert({
        where: { roleId_permissionId: { roleId: extGold.id, permissionId: networkPermMap[key] } },
        update: {},
        create: { roleId: extGold.id, permissionId: networkPermMap[key] },
      });
    }
  }
  console.log("  Seeded network role permissions");

  // ========================
  // ADMIN USER (as NetworkProfile)
  // ========================
  console.log("Seeding admin user...");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@herd.com";
  const adminProfileType = await prisma.networkProfileType.findUnique({ where: { slug: "admin" } });
  if (adminProfileType) {
    const adminUser = await prisma.networkProfile.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        firstName: "Admin",
        lastName: "",
        email: adminEmail,
        networkType: "INTERNAL",
        profileTypeId: adminProfileType.id,
        status: "ACTIVE",
      },
    });
    // Assign super_admin role
    await prisma.networkProfileRole.upsert({
      where: { profileId_roleId: { profileId: adminUser.id, roleId: superAdmin.id } },
      update: {},
      create: { profileId: adminUser.id, roleId: superAdmin.id },
    });
    console.log(`  Seeded admin user: ${adminEmail}`);
  }

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
    where: { email: "admin@herd.com" },
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
