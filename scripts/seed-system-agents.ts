/**
 * Seed system agents — orchestrator, plans-architect, and block agents.
 * Run with: npx tsx scripts/seed-system-agents.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env" });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DIRECT_URL or DATABASE_URL env var");
  process.exit(1);
}
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

interface SystemAgent {
  key: string;
  name: string;
  description: string;
  category: "COACHING" | "ANALYTICS" | "MULTIMODAL";
  role: "ORCHESTRATOR" | "SPECIALIST" | "BLOCK";
  scope: string | null;
  modelId: string;
  maxTokens: number;
  systemPrompt: string;
  isConversational: boolean;
  confirmationTier: string;
  autoNavigate: boolean;
}

const SYSTEM_AGENTS: SystemAgent[] = [
  // Orchestrator
  {
    key: "orchestrator",
    name: "HERD AI",
    description:
      "Main orchestrator agent with access to all blocks and capabilities across the platform.",
    category: "MULTIMODAL",
    role: "ORCHESTRATOR",
    scope: null,
    modelId: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    systemPrompt:
      "You are the HERD AI assistant — the main orchestrator for HERD OS, a subscription operations platform. You can search any data and execute actions across all blocks. Be helpful, concise, and action-oriented.",
    isConversational: true,
    confirmationTier: "tiered",
    autoNavigate: false,
  },
  // Plans Architect (specialist)
  {
    key: "plans-architect",
    name: "Plans Architect",
    description:
      "Specialist agent for managing all subscription plan configuration, pricing, credits, discount rules, and benefit assignments.",
    category: "COACHING",
    role: "SPECIALIST",
    scope: "plans",
    modelId: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    systemPrompt:
      "You are the Plans Architect — HERD's AI specialist for managing subscription plans. You have full control over ALL plan configuration and benefit assignments across every plan.",
    isConversational: true,
    confirmationTier: "tiered",
    autoNavigate: false,
  },
  // Projections Architect (specialist)
  {
    key: "projections-architect",
    name: "Projections Architect",
    description:
      "Specialist agent for financial modeling, scenario analysis, and what-if projections. Manages all saved projection models and can calculate MRR, margins, LTV/CAC, breakeven, and 24-month cohort projections.",
    category: "ANALYTICS",
    role: "SPECIALIST",
    scope: "projections",
    modelId: "claude-sonnet-4-20250514",
    maxTokens: 8192,
    systemPrompt:
      "You are the Projections Architect — HERD's AI specialist for financial modeling and scenario analysis. You can create, modify, compare, and analyze financial projection models. You understand MRR, margins, LTV/CAC, breakeven analysis, 24-month cohort projections, commission structures (including residual delays), and profit split distributions.\n\nIMPORTANT: When the user is editing a model, you receive their LIVE EDITOR STATE with every message — the current assumptions and calculated results in real time. When the user asks about a metric, explains a value, or wants to understand their model, ALWAYS use this live editor data first. Do NOT use saved scenarios or system defaults unless the user specifically asks about a saved model. Walk through the math step by step using the actual numbers from the live state.\n\nAlways explain the business impact of assumption changes clearly.",
    isConversational: true,
    confirmationTier: "simple",
    autoNavigate: false,
  },
  // Block agents
  ...([
    ["products", "Products Agent", "Product catalog management"],
    ["events", "Events Agent", "Calendar event management"],
    ["meetings", "Meetings Agent", "Meeting scheduling and management"],
    ["agents", "AI Agents Agent", "AI agent configuration management"],
    ["partners", "Partners Agent", "Partner brand management"],
    ["perks", "Perks Agent", "Perk and benefit management"],
    ["community", "Community Agent", "Community benefit management"],
    ["pages", "Pages Agent", "Landing page management"],
    ["documents", "Documents Agent", "Document management"],
    ["images", "Images Agent", "Image asset management"],
    ["videos", "Videos Agent", "Video asset management"],
    ["audios", "Audios Agent", "Audio asset management"],
    ["tables", "Tables Agent", "Table and spreadsheet management"],
    ["forms", "Forms Agent", "Form management"],
    ["links", "Links Agent", "Link management"],
    ["feeds", "Feeds Agent", "Feed management"],
    ["apps", "Apps Agent", "App integration management"],
    ["tasks", "Tasks Agent", "Task management"],
    ["subscriptions", "Subscriptions Agent", "Subscription management"],
  ] as const).map(
    ([scope, name, desc]): SystemAgent => ({
      key: `block-${scope}`,
      name,
      description: `Specialist agent for ${desc.toLowerCase()}.`,
      category: "COACHING",
      role: "BLOCK",
      scope,
      modelId: "claude-haiku-4-5-20251001",
      maxTokens: 4096,
      systemPrompt: `You are the ${name} — a specialist AI assistant for the ${name.replace(" Agent", "")} block in HERD OS. You can search data and execute actions within your block. Be helpful, concise, and action-oriented.`,
      isConversational: true,
      confirmationTier: "simple",
      autoNavigate: false,
    })
  ),
];

async function main() {
  console.log("Seeding system agents...\n");

  let created = 0;
  let skipped = 0;

  for (const agent of SYSTEM_AGENTS) {
    const existing = await prisma.agent.findUnique({
      where: { key: agent.key },
    });

    if (existing) {
      // Update existing to ensure isSystem flag and role are set
      await prisma.agent.update({
        where: { key: agent.key },
        data: {
          role: agent.role,
          scope: agent.scope,
          isSystem: true,
          confirmationTier: agent.confirmationTier,
          autoNavigate: agent.autoNavigate,
          isConversational: agent.isConversational,
          historyWindow: 30,
        },
      });
      console.log(`  Updated: ${agent.key} (${agent.role})`);
      skipped++;
    } else {
      await prisma.agent.create({
        data: {
          key: agent.key,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          role: agent.role,
          scope: agent.scope,
          isSystem: true,
          status: "ACTIVE",
          modelType: "TEXT",
          modelId: agent.modelId,
          maxTokens: agent.maxTokens,
          systemPrompt: agent.systemPrompt,
          isConversational: agent.isConversational,
          confirmationTier: agent.confirmationTier,
          autoNavigate: agent.autoNavigate,
          historyWindow: 30,
        },
      });
      console.log(`  Created: ${agent.key} (${agent.role})`);
      created++;
    }
  }

  console.log(
    `\nDone: ${created} created, ${skipped} updated, ${SYSTEM_AGENTS.length} total`
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
