-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionVisibility" AS ENUM ('PUBLIC', 'REP_ONLY', 'HIDDEN');

-- CreateEnum
CREATE TYPE "BillingAnchor" AS ENUM ('SIGNUP_DATE', 'FIRST_OF_MONTH');

-- CreateEnum
CREATE TYPE "CreditIssuingTiming" AS ENUM ('ON_PAYMENT', 'FIXED_DATE');

-- CreateEnum
CREATE TYPE "CreditExpiryBehavior" AS ENUM ('FORFEIT', 'CONVERT', 'DONATE');

-- CreateEnum
CREATE TYPE "TierChangeTiming" AS ENUM ('IMMEDIATE', 'NEXT_CYCLE');

-- CreateEnum
CREATE TYPE "CreditOnChange" AS ENUM ('CARRY_OVER', 'RESET', 'FORFEIT_EXCESS');

-- CreateEnum
CREATE TYPE "PauseCreditBehavior" AS ENUM ('FROZEN', 'FORFEIT');

-- CreateEnum
CREATE TYPE "CancelCreditBehavior" AS ENUM ('FORFEIT', 'GRACE_PERIOD', 'KEEP_FOREVER');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BETA', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "AgentCategory" AS ENUM ('NUTRITION', 'TRAINING', 'RECOVERY', 'COACHING', 'ANALYTICS', 'IMAGE_GENERATION', 'VIDEO_GENERATION', 'VOICE', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'VOICE');

-- CreateEnum
CREATE TYPE "KnowledgeItemType" AS ENUM ('DOCUMENT', 'URL', 'TEXT', 'FAQ', 'API_REFERENCE');

-- CreateEnum
CREATE TYPE "KnowledgeItemStatus" AS ENUM ('DRAFT', 'PROCESSING', 'ACTIVE', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentToolAuthType" AS ENUM ('NONE', 'API_KEY', 'OAUTH2', 'BEARER_TOKEN', 'CUSTOM_HEADER');

-- CreateEnum
CREATE TYPE "AgentRole" AS ENUM ('ORCHESTRATOR', 'SPECIALIST', 'BLOCK');

-- CreateEnum
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OrgRoleType" AS ENUM ('REGIONAL_LEADER', 'TEAM_LEAD', 'REP');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('EARNED', 'HELD', 'RELEASED', 'CLAWED_BACK', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "LedgerEntrySource" AS ENUM ('UPFRONT_BONUS', 'RESIDUAL', 'OVERRIDE', 'ACCELERATOR_BONUS', 'CLAWBACK', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutCadence" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PartnerBenefitType" AS ENUM ('PERCENTAGE_DISCOUNT', 'FLAT_DISCOUNT', 'FREE_TRIAL', 'FREE_PRODUCT', 'BOGO', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnerCommissionType" AS ENUM ('PERCENTAGE', 'FLAT', 'CPA', 'RECURRING', 'HYBRID');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('RESEARCHED', 'APPLIED', 'APPROVED', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "PartnerTierAccess" AS ENUM ('ALL', 'BASIC', 'PLUS', 'PREMIUM', 'ELITE');

-- CreateEnum
CREATE TYPE "PerkStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommunityBenefitStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "KnowledgeFolderType" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServicePricingType" AS ENUM ('FIXED', 'HOURLY', 'DAILY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('SUGGESTION', 'BUG', 'COMPLAINT', 'PRAISE', 'QUESTION', 'IDEA');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'TRIAGED', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED');

-- CreateEnum
CREATE TYPE "FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "KnowledgeFormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "KnowledgeAppCategory" AS ENUM ('FITNESS', 'HEALTH', 'NUTRITION', 'OTHER');

-- CreateEnum
CREATE TYPE "KnowledgeAppDataCategory" AS ENUM ('SLEEP', 'ACTIVITY', 'RECOVERY', 'HEART_RATE', 'WORKOUT', 'READINESS', 'BODY', 'APP_NUTRITION', 'APP_OTHER');

-- CreateEnum
CREATE TYPE "KnowledgeRSSFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('BILLING', 'PAYMENT', 'CRM', 'ANALYTICS', 'MARKETING', 'COMMUNICATION', 'SUPPORT', 'MEETINGS', 'PROJECT_MANAGEMENT', 'SOCIAL_MEDIA', 'AI_MODELS', 'VOICE', 'VIDEO', 'NOTIFICATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('AVAILABLE', 'CONNECTED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('INCOMING', 'OUTGOING', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "NetworkType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "OverrideEffect" AS ENUM ('GRANT', 'DENY');

-- CreateEnum
CREATE TYPE "FitnessGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'PERFORMANCE', 'ENDURANCE', 'GENERAL_WELLNESS', 'RECOVERY', 'STRENGTH', 'BODY_RECOMP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('VIRTUAL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'RECORDING', 'PROCESSING', 'READY', 'ERROR');

-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('GOOGLE_MEET', 'ZOOM', 'MICROSOFT_TEAMS', 'IN_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "CalendarSource" AS ENUM ('GOOGLE_CALENDAR', 'OUTLOOK', 'ICAL');

-- CreateEnum
CREATE TYPE "EventSyncStatus" AS ENUM ('SYNCED', 'STALE', 'ERROR');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('CONFIRMED', 'TENTATIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageChannelType" AS ENUM ('INTERNAL', 'EMAIL', 'SMS', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'SLACK', 'INTERCOM', 'LINKEDIN', 'X_TWITTER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MessageThreadStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED', 'SNOOZED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MarketplaceSectionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketplaceCreationPath" AS ENUM ('MANUAL', 'COPILOT', 'AUTONOMOUS');

-- CreateEnum
CREATE TYPE "MarketplaceScopeType" AS ENUM ('ALL', 'CATEGORY', 'SUB_CATEGORY', 'ITEM');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('EMAIL', 'SOCIAL', 'ADS', 'EVENT', 'CONTENT', 'WEBINAR', 'REFERRAL', 'DIRECT_MAIL', 'SMS', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignObjective" AS ENUM ('AWARENESS', 'ACQUISITION', 'ACTIVATION', 'RETENTION', 'REVENUE', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ExperienceFormat" AS ENUM ('IN_PERSON', 'ONLINE', 'HYBRID', 'SELF_PACED');

-- CreateEnum
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'SOLD_OUT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoutineTriggerType" AS ENUM ('MANUAL', 'SCHEDULE', 'EVENT');

-- CreateEnum
CREATE TYPE "RoutineStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoutineRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoutineTriggerSource" AS ENUM ('MANUAL', 'SCHEDULE', 'EVENT', 'BACKFILL');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "redemptionType" TEXT NOT NULL DEFAULT 'Members Store',
    "retailPrice" DECIMAL(10,2) NOT NULL,
    "memberPrice" DECIMAL(10,2) NOT NULL,
    "costOfGoods" DECIMAL(10,2) NOT NULL,
    "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "handlingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentProcessingPct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "paymentProcessingFlat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "mapPrice" DECIMAL(10,2),
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weightOz" DECIMAL(8,2),
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "sourceUrl" TEXT,
    "flavor" TEXT,
    "variants" JSONB,
    "servingSize" TEXT,
    "servingsPerContainer" INTEGER,
    "ingredients" TEXT,
    "supplementFacts" JSONB,
    "warnings" TEXT,
    "scrapeStatus" TEXT,
    "scrapeError" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "rescrapeInterval" TEXT,
    "nextRescrapeAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "category" "AgentCategory" NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'bot',
    "iconUrl" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "modelType" "ModelType" NOT NULL DEFAULT 'TEXT',
    "modelProvider" TEXT,
    "modelId" TEXT,
    "systemPrompt" TEXT,
    "temperature" DECIMAL(3,2),
    "maxTokens" INTEGER,
    "imageSize" TEXT,
    "imageStyle" TEXT,
    "imageQuality" TEXT,
    "videoDuration" INTEGER,
    "videoResolution" TEXT,
    "videoAspectRatio" TEXT,
    "voiceId" TEXT,
    "voiceSpeed" DECIMAL(3,2),
    "voiceStability" DECIMAL(3,2),
    "dailyUsageLimit" INTEGER,
    "monthlyCostEstimate" DECIMAL(10,2),
    "avgTokensPerCall" INTEGER,
    "requiresMedia" BOOLEAN NOT NULL DEFAULT false,
    "requiresHealth" BOOLEAN NOT NULL DEFAULT false,
    "isConversational" BOOLEAN NOT NULL DEFAULT false,
    "responseFormat" TEXT,
    "role" "AgentRole" NOT NULL DEFAULT 'BLOCK',
    "scope" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "confirmationTier" TEXT NOT NULL DEFAULT 'none',
    "autoNavigate" BOOLEAN NOT NULL DEFAULT false,
    "historyWindow" INTEGER NOT NULL DEFAULT 30,
    "acceptsImages" BOOLEAN NOT NULL DEFAULT false,
    "acceptsAudio" BOOLEAN NOT NULL DEFAULT false,
    "acceptsVideo" BOOLEAN NOT NULL DEFAULT false,
    "acceptsDocuments" BOOLEAN NOT NULL DEFAULT false,
    "canGenerateImages" BOOLEAN NOT NULL DEFAULT false,
    "canGenerateAudio" BOOLEAN NOT NULL DEFAULT false,
    "canGenerateVideo" BOOLEAN NOT NULL DEFAULT false,
    "canGeneratePresentations" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTierAccess" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyUsageLimitOverride" INTEGER,
    "priorityAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTierAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentKnowledgeItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "type" "KnowledgeItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "sourceUrl" TEXT,
    "fileKey" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "status" "KnowledgeItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentKnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSkill" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "promptFragment" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresTools" TEXT[],
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTool" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "toolSchema" JSONB,
    "endpointUrl" TEXT,
    "httpMethod" TEXT NOT NULL DEFAULT 'POST',
    "authType" "AgentToolAuthType" NOT NULL DEFAULT 'NONE',
    "authConfig" JSONB,
    "headers" JSONB,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitPerMinute" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "colorAccent" TEXT NOT NULL DEFAULT '#6B7280',
    "iconUrl" TEXT,
    "description" TEXT,
    "highlightFeatures" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "SubscriptionVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "quarterlyPrice" DECIMAL(10,2) NOT NULL,
    "annualPrice" DECIMAL(10,2) NOT NULL,
    "quarterlyDisplay" DECIMAL(10,2),
    "annualDisplay" DECIMAL(10,2),
    "setupFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "billingAnchor" "BillingAnchor" NOT NULL DEFAULT 'SIGNUP_DATE',
    "avgShippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgHandlingCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "processingFeePct" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "processingFeeFlat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "monthlyCredits" DECIMAL(10,2) NOT NULL,
    "creditExpirationDays" INTEGER NOT NULL DEFAULT 60,
    "creditIssuing" "CreditIssuingTiming" NOT NULL DEFAULT 'ON_PAYMENT',
    "rolloverMonths" INTEGER NOT NULL DEFAULT 0,
    "rolloverCap" DECIMAL(10,2),
    "creditExpiry" "CreditExpiryBehavior" NOT NULL DEFAULT 'FORFEIT',
    "annualBonusCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "referralCreditAmt" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "partnerDiscountPercent" DECIMAL(5,2) NOT NULL,
    "includedAIFeatures" TEXT[],
    "apparelCadence" TEXT NOT NULL,
    "apparelBudget" DECIMAL(10,2),
    "maxMembers" INTEGER,
    "geoRestriction" TEXT[],
    "minimumAge" INTEGER,
    "inviteOnly" BOOLEAN NOT NULL DEFAULT false,
    "repChannelOnly" BOOLEAN NOT NULL DEFAULT false,
    "upgradeToTierIds" TEXT[],
    "downgradeToTierIds" TEXT[],
    "upgradeTiming" "TierChangeTiming" NOT NULL DEFAULT 'IMMEDIATE',
    "downgradeTiming" "TierChangeTiming" NOT NULL DEFAULT 'NEXT_CYCLE',
    "creditOnUpgrade" "CreditOnChange" NOT NULL DEFAULT 'CARRY_OVER',
    "creditOnDowngrade" "CreditOnChange" NOT NULL DEFAULT 'FORFEIT_EXCESS',
    "minimumCommitMonths" INTEGER NOT NULL DEFAULT 1,
    "pauseAllowed" BOOLEAN NOT NULL DEFAULT false,
    "pauseMaxMonths" INTEGER NOT NULL DEFAULT 0,
    "pauseCreditBehavior" "PauseCreditBehavior" NOT NULL DEFAULT 'FROZEN',
    "cancelCreditBehavior" "CancelCreditBehavior" NOT NULL DEFAULT 'FORFEIT',
    "cancelCreditGraceDays" INTEGER NOT NULL DEFAULT 0,
    "winbackDays" INTEGER NOT NULL DEFAULT 0,
    "winbackBonusCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "exitSurveyRequired" BOOLEAN NOT NULL DEFAULT false,
    "agentConfig" JSONB,
    "communityConfig" JSONB,
    "perksConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionStructure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "clawbackWindowDays" INTEGER NOT NULL DEFAULT 60,
    "residualPercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionTierRate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commissionStructureId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "flatBonusAmount" DECIMAL(10,2) NOT NULL,
    "acceleratorThreshold" DECIMAL(5,2),
    "acceleratorMultiplier" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionTierRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerBrand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "discountDescription" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "websiteUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "kickbackType" TEXT NOT NULL,
    "kickbackValue" DECIMAL(10,2),
    "category" TEXT NOT NULL,
    "audienceBenefit" TEXT,
    "benefitType" "PartnerBenefitType",
    "affiliateSignupUrl" TEXT,
    "affiliateLinkPlaceholder" TEXT,
    "affiliateNetwork" TEXT,
    "commissionRate" TEXT,
    "commissionType" "PartnerCommissionType",
    "cookieDuration" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "tierAccess" "PartnerTierAccess" NOT NULL DEFAULT 'ALL',
    "scrapedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTierAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "partnerBrandId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerTierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionTierId" UUID,
    "billingCycle" TEXT,
    "scenarioName" TEXT,
    "color" TEXT,
    "assumptions" JSONB NOT NULL,
    "results" JSONB NOT NULL,
    "createdBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierPricingSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionTierId" UUID NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "quarterlyPrice" DECIMAL(10,2),
    "annualPrice" DECIMAL(10,2),
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TierPricingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpexCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpexCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpexMilestoneLevel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "memberCount" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpexMilestoneLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpexItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vendor" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpexItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpexMilestone" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "itemId" UUID NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "monthlyCost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpexMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionRedemptionRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionTierId" UUID NOT NULL,
    "redemptionType" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionRedemptionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'office',
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "D2DPartner" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "D2DPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgNode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "d2dPartnerId" UUID NOT NULL,
    "parentId" UUID,
    "name" TEXT NOT NULL,
    "roleType" "OrgRoleType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "residualPercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "legacyStructureId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlanRate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commissionPlanId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "roleType" "OrgRoleType" NOT NULL,
    "upfrontBonus" DECIMAL(10,2) NOT NULL,
    "residualPercent" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlanRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverrideRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commissionPlanId" UUID NOT NULL,
    "roleType" "OrgRoleType" NOT NULL,
    "overrideType" TEXT NOT NULL,
    "overrideValue" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OverrideRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceTier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commissionPlanId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "minSales" INTEGER NOT NULL,
    "maxSales" INTEGER,
    "bonusMultiplier" DECIMAL(5,2) NOT NULL,
    "bonusFlat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClawbackRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agreementId" UUID NOT NULL,
    "windowDays" INTEGER NOT NULL,
    "clawbackPercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClawbackRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAgreement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "d2dPartnerId" UUID NOT NULL,
    "commissionPlanId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "payoutCadence" "PayoutCadence" NOT NULL DEFAULT 'MONTHLY',
    "holdPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionLedgerEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orgNodeId" UUID NOT NULL,
    "agreementId" UUID,
    "entryType" "LedgerEntryType" NOT NULL,
    "source" "LedgerEntrySource" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "subscriptionTierId" UUID,
    "relatedEntryId" UUID,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perk" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'gift',
    "status" "PerkStatus" NOT NULL DEFAULT 'DRAFT',
    "hasSubConfig" BOOLEAN NOT NULL DEFAULT false,
    "subConfigLabel" TEXT,
    "subConfigType" TEXT,
    "subConfigOptions" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerkTierAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "perkId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "configValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerkTierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityBenefit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "longDescription" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'users',
    "status" "CommunityBenefitStatus" NOT NULL DEFAULT 'DRAFT',
    "platform" TEXT,
    "accessUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityBenefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityBenefitTierAssignment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "communityBenefitId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityBenefitTierAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFolder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "folderType" "KnowledgeFolderType" NOT NULL DEFAULT 'DOCUMENT',
    "parentId" UUID,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "folderId" UUID,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "website" TEXT,
    "domain" TEXT,
    "logoUrl" TEXT,
    "industry" TEXT,
    "size" "CompanySize",
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "description" TEXT,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "ownerId" UUID,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "companyId" UUID,
    "ownerId" UUID,
    "source" TEXT,
    "street" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "birthday" TIMESTAMP(3),
    "linkedinUrl" TEXT,
    "twitterHandle" TEXT,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "category" TEXT,
    "duration" TEXT,
    "price" DECIMAL(10,2),
    "pricingType" "ServicePricingType" NOT NULL DEFAULT 'FIXED',
    "imageUrl" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'briefcase',
    "status" "ServiceStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "type" "FeedbackType" NOT NULL DEFAULT 'SUGGESTION',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "priority" "FeedbackPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "tags" TEXT[],
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "entityType" TEXT,
    "entityId" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "entityType" TEXT,
    "entityId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeImage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "folderId" UUID,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeVideo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "thumbnailUrl" TEXT,
    "folderId" UUID,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAudio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "folderId" UUID,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "sourceIntegration" TEXT,
    "sourceId" TEXT,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL,
    "faviconUrl" TEXT,
    "ogImageUrl" TEXT,
    "scrapeMode" TEXT NOT NULL DEFAULT 'SINGLE',
    "maxPages" INTEGER NOT NULL DEFAULT 100,
    "pagesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "pagesScraped" INTEGER NOT NULL DEFAULT 0,
    "pagesErrored" INTEGER NOT NULL DEFAULT 0,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "textContent" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "lastScrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeLinkPage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "linkId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "textContent" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeLinkPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeTable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "textContent" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "fieldCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "sourceType" TEXT,
    "sourceId" TEXT,
    "sourceImportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeTableField" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tableId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "options" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeTableField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeTableRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tableId" UUID NOT NULL,
    "data" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeTableRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeForm" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "formStatus" "KnowledgeFormStatus" NOT NULL DEFAULT 'DRAFT',
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "textContent" TEXT,
    "thankYouMessage" TEXT,
    "accessMode" TEXT NOT NULL DEFAULT 'PUBLIC',
    "accessPassword" TEXT,
    "maxResponses" INTEGER,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "templateKey" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFormSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeFormSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFormField" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "validation" JSONB,
    "conditionalLogic" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeFormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeFormResponse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "formId" UUID NOT NULL,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "answers" JSONB NOT NULL,
    "textContent" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "submitterName" TEXT,
    "submitterEmail" TEXT,
    "submitterIp" TEXT,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeFormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeApp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "category" "KnowledgeAppCategory" NOT NULL DEFAULT 'FITNESS',
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "credentials" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'oauth2',
    "syncFrequencyMin" INTEGER NOT NULL DEFAULT 1440,
    "dataCategories" TEXT[],
    "syncStartDate" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAppDataPoint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appId" UUID NOT NULL,
    "category" "KnowledgeAppDataCategory" NOT NULL,
    "date" DATE NOT NULL,
    "rawData" JSONB NOT NULL,
    "textContent" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeAppDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAppSyncLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "syncedFrom" TIMESTAMP(3),
    "syncedTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeAppSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRSSFeed" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "feedUrl" TEXT NOT NULL,
    "siteUrl" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "faviconUrl" TEXT,
    "frequency" "KnowledgeRSSFrequency" NOT NULL DEFAULT 'DAILY',
    "instructions" TEXT,
    "includeKeywords" TEXT[],
    "excludeKeywords" TEXT[],
    "maxEntriesPerSync" INTEGER NOT NULL DEFAULT 20,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "textContent" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "entryCount" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "lastNewEntryAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceFeature" TEXT,

    CONSTRAINT "KnowledgeRSSFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRSSEntry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "feedId" UUID NOT NULL,
    "guid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "summary" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "categories" TEXT[],
    "imageUrl" TEXT,
    "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "textContent" TEXT,
    "contentLength" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "scrapedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRSSEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRSSSyncLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "feedId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "entriesFound" INTEGER NOT NULL DEFAULT 0,
    "entriesMatched" INTEGER NOT NULL DEFAULT 0,
    "entriesScraped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRSSSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "category" "IntegrationCategory" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'AVAILABLE',
    "websiteUrl" TEXT,
    "docsUrl" TEXT,
    "credentials" TEXT,
    "configJson" TEXT,
    "authType" TEXT,
    "oauthScopes" TEXT[],
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_connections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "externalUserId" TEXT,
    "externalEmail" TEXT,
    "scopes" TEXT[],
    "metadata" JSONB,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationTierMapping" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integrationId" UUID NOT NULL,
    "externalPlanId" TEXT NOT NULL,
    "externalPlanName" TEXT,
    "subscriptionTierId" UUID NOT NULL,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'INCOMING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationTierMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integrationId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integrationId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_compensation_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commissionRules" JSONB NOT NULL DEFAULT '{}',
    "bonusRules" JSONB NOT NULL DEFAULT '{}',
    "pointsRules" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_compensation_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "color" TEXT,
    "qualificationRules" JSONB NOT NULL DEFAULT '{}',
    "benefits" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rank_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_profile_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "networkType" "NetworkType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "wizardFields" JSONB NOT NULL DEFAULT '[]',
    "defaultRoleIds" TEXT[],
    "defaultCompPlanId" UUID,
    "defaultRankId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_profile_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "networkType" "NetworkType",
    "parentRoleId" UUID,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_role_permissions" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "network_role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "network_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "networkType" "NetworkType" NOT NULL,
    "profileTypeId" UUID NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "parentId" UUID,
    "onboardedAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_profile_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "attributeKey" TEXT NOT NULL,
    "attributeValue" JSONB NOT NULL,

    CONSTRAINT "network_profile_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_profile_hierarchy_paths" (
    "ancestorId" UUID NOT NULL,
    "descendantId" UUID NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "network_profile_hierarchy_paths_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "network_profile_roles" (
    "profileId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" UUID,

    CONSTRAINT "network_profile_roles_pkey" PRIMARY KEY ("profileId","roleId")
);

-- CreateTable
CREATE TABLE "network_profile_permission_overrides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" "OverrideEffect" NOT NULL,
    "reason" TEXT,

    CONSTRAINT "network_profile_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_profile_compensations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "compPlanId" UUID NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,

    CONSTRAINT "network_profile_compensations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_profile_ranks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "rankTierId" UUID NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualifyingMetrics" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "network_profile_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_points_ledger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" UUID,
    "description" TEXT,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_monthly_performances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profileId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalReferrals" INTEGER NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "rankTierId" UUID,
    "rankPosition" INTEGER,

    CONSTRAINT "network_monthly_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamLeadId" UUID,
    "networkType" "NetworkType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "network_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "network_team_members" (
    "teamId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "network_team_members_pkey" PRIMARY KEY ("teamId","profileId")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "headId" UUID,
    "networkType" "NetworkType" NOT NULL DEFAULT 'INTERNAL',
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_members" (
    "departmentId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "title" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_members_pkey" PRIMARY KEY ("departmentId","profileId")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fitnessGoal" "FitnessGoal" NOT NULL,
    "customGoalDescription" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageShareLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "token" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "permission" TEXT NOT NULL DEFAULT 'view',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackageShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageTierVariant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packageId" UUID NOT NULL,
    "subscriptionTierId" UUID NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "totalCreditsUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageTierVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageTierProduct" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "variantId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "creditCost" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageTierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
    "userId" UUID NOT NULL,
    "agentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "sources" JSONB,
    "artifacts" JSONB,
    "attachments" JSONB,
    "mediaOutputs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoImage" TEXT,
    "pageStyles" JSONB NOT NULL DEFAULT '{}',
    "publishedVersionId" UUID,
    "lastPublishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pageId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landing_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_page_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pageId" UUID NOT NULL,
    "sectionType" TEXT NOT NULL,
    "name" TEXT,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "components" JSONB NOT NULL DEFAULT '[]',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingType" "MeetingType" NOT NULL,
    "platform" "MeetingPlatform" NOT NULL DEFAULT 'IN_PERSON',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "audioFileUrl" TEXT,
    "audioFileSize" INTEGER,
    "audioMimeType" TEXT,
    "transcript" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "actionItems" JSONB,
    "keyTopics" TEXT[],
    "calendarEventId" TEXT,
    "meetingUrl" TEXT,
    "externalBotId" TEXT,
    "participantCount" INTEGER,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meetingId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "speakerLabel" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_agent_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "botName" TEXT NOT NULL DEFAULT 'HERD Notetaker',
    "autoJoin" BOOLEAN NOT NULL DEFAULT true,
    "joinMinutesBefore" INTEGER NOT NULL DEFAULT 1,
    "recordingMode" TEXT NOT NULL DEFAULT 'audio_only',
    "autoTranscribe" BOOLEAN NOT NULL DEFAULT true,
    "autoSummarize" BOOLEAN NOT NULL DEFAULT true,
    "autoExtractActions" BOOLEAN NOT NULL DEFAULT true,
    "joinAllMeetings" BOOLEAN NOT NULL DEFAULT true,
    "includePlatforms" TEXT[],
    "excludeKeywords" TEXT[],
    "includeKeywords" TEXT[],
    "minimumAttendees" INTEGER NOT NULL DEFAULT 0,
    "generateNextSteps" BOOLEAN NOT NULL DEFAULT true,
    "generateSuggestions" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnCompletion" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_agent_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_syncs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source" "CalendarSource" NOT NULL,
    "externalCalendarId" TEXT NOT NULL,
    "calendarName" TEXT NOT NULL,
    "calendarColor" TEXT,
    "timeZone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "integrationId" UUID,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "syncToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_event_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "calendarSyncId" UUID NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "timeZone" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "syncStatus" "EventSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "htmlLink" TEXT,
    "meetingUrl" TEXT,
    "conferenceData" JSONB,
    "recurrence" TEXT[],
    "recurringEventId" TEXT,
    "organizerEmail" TEXT,
    "organizerName" TEXT,
    "visibility" TEXT,
    "transparency" TEXT,
    "colorId" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event_attendees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "responseStatus" TEXT NOT NULL,
    "isOrganizer" BOOLEAN NOT NULL DEFAULT false,
    "isSelf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NONE',
    "dueDate" TIMESTAMP(3),
    "assignee" TEXT,
    "assigneeEmail" TEXT,
    "projectName" TEXT,
    "labels" TEXT[],
    "sourceIntegration" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "sourceStatus" TEXT,
    "sourcePriority" TEXT,
    "parentTaskId" UUID,
    "completedAt" TIMESTAMP(3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_service_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_service_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integrationId" UUID,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inputRef" TEXT,
    "resultJson" TEXT,
    "outputUrl" TEXT,
    "audioDurationSec" DOUBLE PRECISION,
    "costCents" INTEGER,
    "errorMessage" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "voice_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integrationId" UUID,
    "operation" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inputRef" TEXT,
    "resultJson" TEXT,
    "outputUrl" TEXT,
    "videoDurationSec" DOUBLE PRECISION,
    "costCents" INTEGER,
    "errorMessage" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "channelType" "MessageChannelType" NOT NULL,
    "integrationId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configJson" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" UUID NOT NULL,
    "contactId" UUID,
    "externalThreadId" TEXT,
    "subject" TEXT,
    "status" "MessageThreadStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "assigneeId" UUID,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "threadId" UUID NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "senderName" TEXT,
    "senderEmail" TEXT,
    "senderExternalId" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "attachments" JSONB,
    "externalId" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconKey" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "MarketplaceSectionStatus" NOT NULL DEFAULT 'DRAFT',
    "creationPath" "MarketplaceCreationPath" NOT NULL DEFAULT 'MANUAL',
    "blockNames" TEXT[],
    "layout" JSONB,
    "components" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_section_scopes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sectionId" UUID NOT NULL,
    "blockName" TEXT NOT NULL,
    "scopeType" "MarketplaceScopeType" NOT NULL,
    "scopeValue" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "allowedProfileTypeIds" UUID[],
    "allowedRoleIds" UUID[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_section_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'LEAD',
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "probability" INTEGER,
    "expectedCloseDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "contactId" UUID,
    "companyId" UUID,
    "campaignId" UUID,
    "ownerId" UUID,
    "source" TEXT,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "channels" "CampaignChannel"[] DEFAULT ARRAY[]::"CampaignChannel"[],
    "objective" "CampaignObjective",
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(12,2),
    "spent" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "audience" TEXT,
    "ownerId" UUID,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "format" "ExperienceFormat" NOT NULL DEFAULT 'IN_PERSON',
    "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationMin" INTEGER,
    "locationName" TEXT,
    "locationUrl" TEXT,
    "capacity" INTEGER,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "coverImageUrl" TEXT,
    "hostId" UUID,
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "status" "RoutineStatus" NOT NULL DEFAULT 'DRAFT',
    "agentId" UUID NOT NULL,
    "triggerType" "RoutineTriggerType" NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "eventBlock" TEXT,
    "eventType" TEXT,
    "eventFilter" JSONB NOT NULL DEFAULT '{}',
    "inputSchema" JSONB NOT NULL DEFAULT '{}',
    "defaultInputs" JSONB NOT NULL DEFAULT '{}',
    "outputFormat" TEXT NOT NULL DEFAULT 'text',
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" "RoutineRunStatus",
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "ownerId" UUID,
    "tags" TEXT[],
    "contentJson" JSONB NOT NULL DEFAULT '{}',
    "contentText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routineId" UUID NOT NULL,
    "status" "RoutineRunStatus" NOT NULL DEFAULT 'QUEUED',
    "triggerSource" "RoutineTriggerSource" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" TEXT,
    "outputJson" JSONB,
    "error" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "stepResults" JSONB NOT NULL DEFAULT '[]',
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routineId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT,
    "agentId" UUID NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL DEFAULT 'text',
    "inputSource" TEXT NOT NULL DEFAULT 'trigger',
    "previousStepId" UUID,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_key_key" ON "Agent"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTierAccess_agentId_subscriptionTierId_key" ON "AgentTierAccess"("agentId", "subscriptionTierId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentKnowledgeItem_agentId_title_key" ON "AgentKnowledgeItem"("agentId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSkill_agentId_key_key" ON "AgentSkill"("agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTool_agentId_key_key" ON "AgentTool"("agentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_slug_key" ON "SubscriptionTier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionTierRate_commissionStructureId_subscriptionTierId_key" ON "CommissionTierRate"("commissionStructureId", "subscriptionTierId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerBrand_key_key" ON "PartnerBrand"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTierAssignment_partnerBrandId_subscriptionTierId_key" ON "PartnerTierAssignment"("partnerBrandId", "subscriptionTierId");

-- CreateIndex
CREATE UNIQUE INDEX "OpexMilestoneLevel_memberCount_key" ON "OpexMilestoneLevel"("memberCount");

-- CreateIndex
CREATE UNIQUE INDEX "OpexMilestone_itemId_memberCount_key" ON "OpexMilestone"("itemId", "memberCount");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionRedemptionRule_subscriptionTierId_redemptionTyp_key" ON "SubscriptionRedemptionRule"("subscriptionTierId", "redemptionType", "scopeType", "scopeValue");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "OrgNode_d2dPartnerId_idx" ON "OrgNode"("d2dPartnerId");

-- CreateIndex
CREATE INDEX "OrgNode_parentId_idx" ON "OrgNode"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPlan_name_version_key" ON "CommissionPlan"("name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPlanRate_commissionPlanId_subscriptionTierId_role_key" ON "CommissionPlanRate"("commissionPlanId", "subscriptionTierId", "roleType");

-- CreateIndex
CREATE UNIQUE INDEX "OverrideRule_commissionPlanId_roleType_key" ON "OverrideRule"("commissionPlanId", "roleType");

-- CreateIndex
CREATE INDEX "PerformanceTier_commissionPlanId_idx" ON "PerformanceTier"("commissionPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "ClawbackRule_agreementId_windowDays_key" ON "ClawbackRule"("agreementId", "windowDays");

-- CreateIndex
CREATE INDEX "PartnerAgreement_d2dPartnerId_idx" ON "PartnerAgreement"("d2dPartnerId");

-- CreateIndex
CREATE INDEX "PartnerAgreement_commissionPlanId_idx" ON "PartnerAgreement"("commissionPlanId");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_orgNodeId_idx" ON "CommissionLedgerEntry"("orgNodeId");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_agreementId_idx" ON "CommissionLedgerEntry"("agreementId");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_entryType_idx" ON "CommissionLedgerEntry"("entryType");

-- CreateIndex
CREATE INDEX "CommissionLedgerEntry_createdAt_idx" ON "CommissionLedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Perk_key_key" ON "Perk"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PerkTierAssignment_perkId_subscriptionTierId_key" ON "PerkTierAssignment"("perkId", "subscriptionTierId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityBenefit_key_key" ON "CommunityBenefit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityBenefitTierAssignment_communityBenefitId_subscript_key" ON "CommunityBenefitTierAssignment"("communityBenefitId", "subscriptionTierId");

-- CreateIndex
CREATE INDEX "KnowledgeFolder_parentId_idx" ON "KnowledgeFolder"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgeFolder_folderType_parentId_idx" ON "KnowledgeFolder"("folderType", "parentId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_folderId_idx" ON "KnowledgeDocument"("folderId");

-- CreateIndex
CREATE INDEX "companies_domain_idx" ON "companies"("domain");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "companies"("industry");

-- CreateIndex
CREATE INDEX "companies_ownerId_idx" ON "companies"("ownerId");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "contacts"("email");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "contacts_ownerId_idx" ON "contacts"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "services_key_key" ON "services"("key");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "services"("status");

-- CreateIndex
CREATE INDEX "feedbacks_status_updatedAt_idx" ON "feedbacks"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "feedbacks_type_idx" ON "feedbacks"("type");

-- CreateIndex
CREATE INDEX "feedbacks_priority_idx" ON "feedbacks"("priority");

-- CreateIndex
CREATE INDEX "feedbacks_entityType_entityId_idx" ON "feedbacks"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "notes_pinned_updatedAt_idx" ON "notes"("pinned", "updatedAt");

-- CreateIndex
CREATE INDEX "notes_archived_idx" ON "notes"("archived");

-- CreateIndex
CREATE INDEX "notes_entityType_entityId_idx" ON "notes"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeImage_folderId_idx" ON "KnowledgeImage"("folderId");

-- CreateIndex
CREATE INDEX "KnowledgeVideo_folderId_idx" ON "KnowledgeVideo"("folderId");

-- CreateIndex
CREATE INDEX "KnowledgeAudio_folderId_idx" ON "KnowledgeAudio"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAudio_sourceIntegration_sourceId_key" ON "KnowledgeAudio"("sourceIntegration", "sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeLinkPage_linkId_idx" ON "KnowledgeLinkPage"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeLinkPage_linkId_url_key" ON "KnowledgeLinkPage"("linkId", "url");

-- CreateIndex
CREATE INDEX "KnowledgeTableField_tableId_idx" ON "KnowledgeTableField"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeTableField_tableId_name_key" ON "KnowledgeTableField"("tableId", "name");

-- CreateIndex
CREATE INDEX "KnowledgeTableRecord_tableId_idx" ON "KnowledgeTableRecord"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeForm_slug_key" ON "KnowledgeForm"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeFormSection_formId_idx" ON "KnowledgeFormSection"("formId");

-- CreateIndex
CREATE INDEX "KnowledgeFormField_sectionId_idx" ON "KnowledgeFormField"("sectionId");

-- CreateIndex
CREATE INDEX "KnowledgeFormResponse_formId_idx" ON "KnowledgeFormResponse"("formId");

-- CreateIndex
CREATE INDEX "KnowledgeFormResponse_submittedAt_idx" ON "KnowledgeFormResponse"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeApp_slug_key" ON "KnowledgeApp"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeAppDataPoint_appId_idx" ON "KnowledgeAppDataPoint"("appId");

-- CreateIndex
CREATE INDEX "KnowledgeAppDataPoint_date_idx" ON "KnowledgeAppDataPoint"("date");

-- CreateIndex
CREATE INDEX "KnowledgeAppDataPoint_category_idx" ON "KnowledgeAppDataPoint"("category");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAppDataPoint_appId_category_date_key" ON "KnowledgeAppDataPoint"("appId", "category", "date");

-- CreateIndex
CREATE INDEX "KnowledgeAppSyncLog_appId_idx" ON "KnowledgeAppSyncLog"("appId");

-- CreateIndex
CREATE INDEX "KnowledgeRSSEntry_feedId_idx" ON "KnowledgeRSSEntry"("feedId");

-- CreateIndex
CREATE INDEX "KnowledgeRSSEntry_publishedAt_idx" ON "KnowledgeRSSEntry"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRSSEntry_feedId_guid_key" ON "KnowledgeRSSEntry"("feedId", "guid");

-- CreateIndex
CREATE INDEX "KnowledgeRSSSyncLog_feedId_idx" ON "KnowledgeRSSSyncLog"("feedId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_slug_key" ON "Integration"("slug");

-- CreateIndex
CREATE INDEX "member_connections_integrationId_idx" ON "member_connections"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "member_connections_profileId_integrationId_key" ON "member_connections"("profileId", "integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationTierMapping_integrationId_externalPlanId_key" ON "IntegrationTierMapping"("integrationId", "externalPlanId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_integrationId_idx" ON "IntegrationWebhookEvent"("integrationId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_eventType_idx" ON "IntegrationWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_integrationId_idx" ON "IntegrationSyncLog"("integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "network_compensation_plans_slug_key" ON "network_compensation_plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rank_tiers_slug_key" ON "rank_tiers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "rank_tiers_level_key" ON "rank_tiers"("level");

-- CreateIndex
CREATE UNIQUE INDEX "network_profile_types_slug_key" ON "network_profile_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "network_roles_slug_key" ON "network_roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "network_permissions_resource_action_key" ON "network_permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "network_profiles_email_key" ON "network_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "network_profile_attributes_profileId_attributeKey_key" ON "network_profile_attributes"("profileId", "attributeKey");

-- CreateIndex
CREATE UNIQUE INDEX "network_profile_permission_overrides_profileId_permissionId_key" ON "network_profile_permission_overrides"("profileId", "permissionId");

-- CreateIndex
CREATE INDEX "network_points_ledger_profileId_period_idx" ON "network_points_ledger"("profileId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "network_monthly_performances_profileId_period_key" ON "network_monthly_performances"("profileId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PackageShareLink_token_key" ON "PackageShareLink"("token");

-- CreateIndex
CREATE INDEX "PackageShareLink_packageId_idx" ON "PackageShareLink"("packageId");

-- CreateIndex
CREATE INDEX "PackageShareLink_token_idx" ON "PackageShareLink"("token");

-- CreateIndex
CREATE INDEX "PackageTierVariant_packageId_idx" ON "PackageTierVariant"("packageId");

-- CreateIndex
CREATE INDEX "PackageTierVariant_subscriptionTierId_idx" ON "PackageTierVariant"("subscriptionTierId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageTierVariant_packageId_subscriptionTierId_key" ON "PackageTierVariant"("packageId", "subscriptionTierId");

-- CreateIndex
CREATE INDEX "PackageTierProduct_variantId_idx" ON "PackageTierProduct"("variantId");

-- CreateIndex
CREATE INDEX "PackageTierProduct_productId_idx" ON "PackageTierProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageTierProduct_variantId_productId_key" ON "PackageTierProduct"("variantId", "productId");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_updatedAt_idx" ON "chat_conversations"("updatedAt");

-- CreateIndex
CREATE INDEX "chat_conversations_agentId_idx" ON "chat_conversations"("agentId");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- CreateIndex
CREATE INDEX "landing_pages_status_idx" ON "landing_pages"("status");

-- CreateIndex
CREATE INDEX "landing_page_versions_pageId_idx" ON "landing_page_versions"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "landing_page_versions_pageId_versionNumber_key" ON "landing_page_versions"("pageId", "versionNumber");

-- CreateIndex
CREATE INDEX "landing_page_sections_pageId_idx" ON "landing_page_sections"("pageId");

-- CreateIndex
CREATE INDEX "landing_page_sections_pageId_sortOrder_idx" ON "landing_page_sections"("pageId", "sortOrder");

-- CreateIndex
CREATE INDEX "meetings_status_idx" ON "meetings"("status");

-- CreateIndex
CREATE INDEX "meetings_meetingType_idx" ON "meetings"("meetingType");

-- CreateIndex
CREATE INDEX "meetings_scheduledAt_idx" ON "meetings"("scheduledAt");

-- CreateIndex
CREATE INDEX "meetings_createdAt_idx" ON "meetings"("createdAt");

-- CreateIndex
CREATE INDEX "meeting_participants_meetingId_idx" ON "meeting_participants"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_event_syncs_source_externalCalendarId_key" ON "calendar_event_syncs"("source", "externalCalendarId");

-- CreateIndex
CREATE INDEX "calendar_events_startAt_idx" ON "calendar_events"("startAt");

-- CreateIndex
CREATE INDEX "calendar_events_endAt_idx" ON "calendar_events"("endAt");

-- CreateIndex
CREATE INDEX "calendar_events_status_idx" ON "calendar_events"("status");

-- CreateIndex
CREATE INDEX "calendar_events_calendarSyncId_idx" ON "calendar_events"("calendarSyncId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_calendarSyncId_externalEventId_key" ON "calendar_events"("calendarSyncId", "externalEventId");

-- CreateIndex
CREATE INDEX "calendar_event_attendees_eventId_idx" ON "calendar_event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "calendar_event_attendees_email_idx" ON "calendar_event_attendees"("email");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_sourceIntegration_idx" ON "tasks"("sourceIntegration");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_sourceIntegration_sourceId_key" ON "tasks"("sourceIntegration", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "foundation_service_config_service_key" ON "foundation_service_config"("service");

-- CreateIndex
CREATE INDEX "voice_jobs_status_idx" ON "voice_jobs"("status");

-- CreateIndex
CREATE INDEX "voice_jobs_operation_idx" ON "voice_jobs"("operation");

-- CreateIndex
CREATE INDEX "voice_jobs_integrationId_idx" ON "voice_jobs"("integrationId");

-- CreateIndex
CREATE INDEX "voice_jobs_sourceType_sourceId_idx" ON "voice_jobs"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "video_jobs_status_idx" ON "video_jobs"("status");

-- CreateIndex
CREATE INDEX "video_jobs_operation_idx" ON "video_jobs"("operation");

-- CreateIndex
CREATE INDEX "video_jobs_integrationId_idx" ON "video_jobs"("integrationId");

-- CreateIndex
CREATE INDEX "video_jobs_sourceType_sourceId_idx" ON "video_jobs"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "message_channels_channelType_integrationId_key" ON "message_channels"("channelType", "integrationId");

-- CreateIndex
CREATE INDEX "message_threads_channelId_idx" ON "message_threads"("channelId");

-- CreateIndex
CREATE INDEX "message_threads_contactId_idx" ON "message_threads"("contactId");

-- CreateIndex
CREATE INDEX "message_threads_status_idx" ON "message_threads"("status");

-- CreateIndex
CREATE INDEX "message_threads_lastMessageAt_idx" ON "message_threads"("lastMessageAt");

-- CreateIndex
CREATE INDEX "message_threads_externalThreadId_idx" ON "message_threads"("externalThreadId");

-- CreateIndex
CREATE INDEX "messages_threadId_idx" ON "messages"("threadId");

-- CreateIndex
CREATE INDEX "messages_sentAt_idx" ON "messages"("sentAt");

-- CreateIndex
CREATE INDEX "messages_externalId_idx" ON "messages"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_sections_slug_key" ON "marketplace_sections"("slug");

-- CreateIndex
CREATE INDEX "marketplace_sections_status_idx" ON "marketplace_sections"("status");

-- CreateIndex
CREATE INDEX "marketplace_section_scopes_sectionId_idx" ON "marketplace_section_scopes"("sectionId");

-- CreateIndex
CREATE INDEX "marketplace_section_scopes_blockName_idx" ON "marketplace_section_scopes"("blockName");

-- CreateIndex
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

-- CreateIndex
CREATE INDEX "deals_contactId_idx" ON "deals"("contactId");

-- CreateIndex
CREATE INDEX "deals_companyId_idx" ON "deals"("companyId");

-- CreateIndex
CREATE INDEX "deals_campaignId_idx" ON "deals"("campaignId");

-- CreateIndex
CREATE INDEX "deals_ownerId_idx" ON "deals"("ownerId");

-- CreateIndex
CREATE INDEX "deals_expectedCloseDate_idx" ON "deals"("expectedCloseDate");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_ownerId_idx" ON "campaigns"("ownerId");

-- CreateIndex
CREATE INDEX "campaigns_startDate_idx" ON "campaigns"("startDate");

-- CreateIndex
CREATE INDEX "campaigns_endDate_idx" ON "campaigns"("endDate");

-- CreateIndex
CREATE INDEX "experiences_status_idx" ON "experiences"("status");

-- CreateIndex
CREATE INDEX "experiences_format_idx" ON "experiences"("format");

-- CreateIndex
CREATE INDEX "experiences_startDate_idx" ON "experiences"("startDate");

-- CreateIndex
CREATE INDEX "experiences_hostId_idx" ON "experiences"("hostId");

-- CreateIndex
CREATE INDEX "routines_status_idx" ON "routines"("status");

-- CreateIndex
CREATE INDEX "routines_triggerType_idx" ON "routines"("triggerType");

-- CreateIndex
CREATE INDEX "routines_nextRunAt_idx" ON "routines"("nextRunAt");

-- CreateIndex
CREATE INDEX "routines_eventBlock_eventType_status_idx" ON "routines"("eventBlock", "eventType", "status");

-- CreateIndex
CREATE INDEX "routines_agentId_idx" ON "routines"("agentId");

-- CreateIndex
CREATE INDEX "routine_runs_routineId_createdAt_idx" ON "routine_runs"("routineId", "createdAt");

-- CreateIndex
CREATE INDEX "routine_runs_status_scheduledFor_idx" ON "routine_runs"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "routine_steps_routineId_idx" ON "routine_steps"("routineId");

-- CreateIndex
CREATE INDEX "routine_steps_agentId_idx" ON "routine_steps"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "routine_steps_routineId_stepOrder_key" ON "routine_steps"("routineId", "stepOrder");

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTierAccess" ADD CONSTRAINT "AgentTierAccess_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTierAccess" ADD CONSTRAINT "AgentTierAccess_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentKnowledgeItem" ADD CONSTRAINT "AgentKnowledgeItem_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentSkill" ADD CONSTRAINT "AgentSkill_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTool" ADD CONSTRAINT "AgentTool_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionTierRate" ADD CONSTRAINT "CommissionTierRate_commissionStructureId_fkey" FOREIGN KEY ("commissionStructureId") REFERENCES "CommissionStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionTierRate" ADD CONSTRAINT "CommissionTierRate_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTierAssignment" ADD CONSTRAINT "PartnerTierAssignment_partnerBrandId_fkey" FOREIGN KEY ("partnerBrandId") REFERENCES "PartnerBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTierAssignment" ADD CONSTRAINT "PartnerTierAssignment_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSnapshot" ADD CONSTRAINT "FinancialSnapshot_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TierPricingSnapshot" ADD CONSTRAINT "TierPricingSnapshot_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpexItem" ADD CONSTRAINT "OpexItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "OpexCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpexMilestone" ADD CONSTRAINT "OpexMilestone_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "OpexItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionRedemptionRule" ADD CONSTRAINT "SubscriptionRedemptionRule_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgNode" ADD CONSTRAINT "OrgNode_d2dPartnerId_fkey" FOREIGN KEY ("d2dPartnerId") REFERENCES "D2DPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgNode" ADD CONSTRAINT "OrgNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrgNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanRate" ADD CONSTRAINT "CommissionPlanRate_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPlanRate" ADD CONSTRAINT "CommissionPlanRate_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverrideRule" ADD CONSTRAINT "OverrideRule_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTier" ADD CONSTRAINT "PerformanceTier_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClawbackRule" ADD CONSTRAINT "ClawbackRule_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "PartnerAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerAgreement" ADD CONSTRAINT "PartnerAgreement_d2dPartnerId_fkey" FOREIGN KEY ("d2dPartnerId") REFERENCES "D2DPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerAgreement" ADD CONSTRAINT "PartnerAgreement_commissionPlanId_fkey" FOREIGN KEY ("commissionPlanId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLedgerEntry" ADD CONSTRAINT "CommissionLedgerEntry_orgNodeId_fkey" FOREIGN KEY ("orgNodeId") REFERENCES "OrgNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionLedgerEntry" ADD CONSTRAINT "CommissionLedgerEntry_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "PartnerAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkTierAssignment" ADD CONSTRAINT "PerkTierAssignment_perkId_fkey" FOREIGN KEY ("perkId") REFERENCES "Perk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerkTierAssignment" ADD CONSTRAINT "PerkTierAssignment_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBenefitTierAssignment" ADD CONSTRAINT "CommunityBenefitTierAssignment_communityBenefitId_fkey" FOREIGN KEY ("communityBenefitId") REFERENCES "CommunityBenefit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityBenefitTierAssignment" ADD CONSTRAINT "CommunityBenefitTierAssignment_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFolder" ADD CONSTRAINT "KnowledgeFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgeFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "KnowledgeFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeImage" ADD CONSTRAINT "KnowledgeImage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "KnowledgeFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeVideo" ADD CONSTRAINT "KnowledgeVideo_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "KnowledgeFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAudio" ADD CONSTRAINT "KnowledgeAudio_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "KnowledgeFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeLinkPage" ADD CONSTRAINT "KnowledgeLinkPage_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "KnowledgeLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeTableField" ADD CONSTRAINT "KnowledgeTableField_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "KnowledgeTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeTableRecord" ADD CONSTRAINT "KnowledgeTableRecord_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "KnowledgeTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFormSection" ADD CONSTRAINT "KnowledgeFormSection_formId_fkey" FOREIGN KEY ("formId") REFERENCES "KnowledgeForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFormField" ADD CONSTRAINT "KnowledgeFormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "KnowledgeFormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeFormResponse" ADD CONSTRAINT "KnowledgeFormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "KnowledgeForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAppDataPoint" ADD CONSTRAINT "KnowledgeAppDataPoint_appId_fkey" FOREIGN KEY ("appId") REFERENCES "KnowledgeApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAppSyncLog" ADD CONSTRAINT "KnowledgeAppSyncLog_appId_fkey" FOREIGN KEY ("appId") REFERENCES "KnowledgeApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRSSEntry" ADD CONSTRAINT "KnowledgeRSSEntry_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeRSSFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRSSSyncLog" ADD CONSTRAINT "KnowledgeRSSSyncLog_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "KnowledgeRSSFeed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_connections" ADD CONSTRAINT "member_connections_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_connections" ADD CONSTRAINT "member_connections_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationTierMapping" ADD CONSTRAINT "IntegrationTierMapping_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationTierMapping" ADD CONSTRAINT "IntegrationTierMapping_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_roles" ADD CONSTRAINT "network_roles_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "network_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_role_permissions" ADD CONSTRAINT "network_role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "network_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_role_permissions" ADD CONSTRAINT "network_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "network_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profiles" ADD CONSTRAINT "network_profiles_profileTypeId_fkey" FOREIGN KEY ("profileTypeId") REFERENCES "network_profile_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profiles" ADD CONSTRAINT "network_profiles_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_attributes" ADD CONSTRAINT "network_profile_attributes_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_hierarchy_paths" ADD CONSTRAINT "network_profile_hierarchy_paths_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_hierarchy_paths" ADD CONSTRAINT "network_profile_hierarchy_paths_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_roles" ADD CONSTRAINT "network_profile_roles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_roles" ADD CONSTRAINT "network_profile_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "network_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_permission_overrides" ADD CONSTRAINT "network_profile_permission_overrides_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_permission_overrides" ADD CONSTRAINT "network_profile_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "network_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_compensations" ADD CONSTRAINT "network_profile_compensations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_compensations" ADD CONSTRAINT "network_profile_compensations_compPlanId_fkey" FOREIGN KEY ("compPlanId") REFERENCES "network_compensation_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_ranks" ADD CONSTRAINT "network_profile_ranks_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_profile_ranks" ADD CONSTRAINT "network_profile_ranks_rankTierId_fkey" FOREIGN KEY ("rankTierId") REFERENCES "rank_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_points_ledger" ADD CONSTRAINT "network_points_ledger_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_monthly_performances" ADD CONSTRAINT "network_monthly_performances_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_monthly_performances" ADD CONSTRAINT "network_monthly_performances_rankTierId_fkey" FOREIGN KEY ("rankTierId") REFERENCES "rank_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_teams" ADD CONSTRAINT "network_teams_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_team_members" ADD CONSTRAINT "network_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "network_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_team_members" ADD CONSTRAINT "network_team_members_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_headId_fkey" FOREIGN KEY ("headId") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageShareLink" ADD CONSTRAINT "PackageShareLink_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageTierVariant" ADD CONSTRAINT "PackageTierVariant_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageTierVariant" ADD CONSTRAINT "PackageTierVariant_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageTierProduct" ADD CONSTRAINT "PackageTierProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "PackageTierVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageTierProduct" ADD CONSTRAINT "PackageTierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_page_versions" ADD CONSTRAINT "landing_page_versions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "landing_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendarSyncId_fkey" FOREIGN KEY ("calendarSyncId") REFERENCES "calendar_event_syncs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event_attendees" ADD CONSTRAINT "calendar_event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_jobs" ADD CONSTRAINT "voice_jobs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_jobs" ADD CONSTRAINT "video_jobs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_channels" ADD CONSTRAINT "message_channels_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "message_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_section_scopes" ADD CONSTRAINT "marketplace_section_scopes_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "marketplace_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_runs" ADD CONSTRAINT "routine_runs_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

