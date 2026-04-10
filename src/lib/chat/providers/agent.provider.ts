import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

const MAX_SYSTEM_PROMPT_LENGTH = 2000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderAgentContent(a: any): string {
  const lines: string[] = [];

  lines.push(`# AI Agent: ${a.name}`);
  lines.push(`Key: ${a.key}`);
  lines.push(`Category: ${a.category}`);
  lines.push(`Status: ${a.status}`);
  lines.push(`Version: ${a.version}`);

  if (a.description) {
    lines.push("", "## Description", a.description);
  }

  if (a.longDescription) {
    lines.push("", "## Detailed Description", a.longDescription);
  }

  // LLM Configuration
  if (a.modelProvider || a.modelId) {
    lines.push("", "## AI Configuration");
    if (a.modelProvider) lines.push(`Provider: ${a.modelProvider}`);
    if (a.modelId) lines.push(`Model: ${a.modelId}`);
    if (a.temperature) lines.push(`Temperature: ${a.temperature}`);
    if (a.maxTokens) lines.push(`Max Tokens: ${a.maxTokens}`);
    if (a.responseFormat) lines.push(`Response Format: ${a.responseFormat}`);
  }

  if (a.systemPrompt) {
    const prompt =
      a.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
        ? a.systemPrompt.slice(0, MAX_SYSTEM_PROMPT_LENGTH) +
          `\n[... truncated, ${a.systemPrompt.length - MAX_SYSTEM_PROMPT_LENGTH} chars omitted]`
        : a.systemPrompt;
    lines.push("", "## System Prompt", prompt);
  }

  // Feature flags
  const flags: string[] = [];
  if (a.isConversational) flags.push("Conversational");
  if (a.requiresMedia) flags.push("Requires Media");
  if (a.requiresHealth) flags.push("Requires Health Data");
  if (flags.length > 0) {
    lines.push("", `Features: ${flags.join(", ")}`);
  }

  // Rate limits
  if (a.dailyUsageLimit || a.monthlyCostEstimate) {
    lines.push("", "## Usage Limits");
    if (a.dailyUsageLimit)
      lines.push(`Daily Usage Limit: ${a.dailyUsageLimit}`);
    if (a.monthlyCostEstimate)
      lines.push(`Monthly Cost Estimate: $${a.monthlyCostEstimate}`);
    if (a.avgTokensPerCall)
      lines.push(`Avg Tokens Per Call: ${a.avgTokensPerCall}`);
  }

  // Skills
  if (a.skills && a.skills.length > 0) {
    lines.push("", "## Skills");
    for (const s of a.skills) {
      lines.push(
        `- ${s.name}${s.description ? `: ${s.description}` : ""}${s.isEnabled ? "" : " (disabled)"}`
      );
    }
  }

  // Tools
  if (a.tools && a.tools.length > 0) {
    lines.push("", "## Tools");
    for (const t of a.tools) {
      lines.push(
        `- ${t.name}${t.description ? `: ${t.description}` : ""}${t.isEnabled ? "" : " (disabled)"}`
      );
    }
  }

  // Tier Access
  if (a.tierAccess && a.tierAccess.length > 0) {
    lines.push("", "## Tier Access");
    for (const ta of a.tierAccess) {
      lines.push(
        `- ${ta.tier.name}: ${ta.isEnabled ? "Enabled" : "Disabled"}${ta.priorityAccess ? " (Priority)" : ""}`
      );
    }
  }

  if (a.tags && a.tags.length > 0) {
    lines.push("", `Tags: ${a.tags.join(", ")}`);
  }

  return lines.join("\n");
}

export class AgentProvider implements DataProvider {
  domain = "foundation";
  types = ["agent"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const agents = await prisma.agent.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        version: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return agents.map((a) => ({
      id: `agent:${a.id}`,
      type: "agent",
      domain: this.domain,
      name: a.name,
      description: a.description,
      contentLength: (a.description?.length || 0) + 1000,
      extra: `category: ${a.category}, v${a.version}`,
    }));
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.agent) return [];

    const agents = await prisma.agent.findMany({
      where: { id: { in: grouped.agent } },
      include: {
        skills: {
          select: {
            name: true,
            description: true,
            isEnabled: true,
            category: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        tools: {
          select: {
            name: true,
            description: true,
            isEnabled: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        tierAccess: {
          include: { tier: { select: { name: true } } },
        },
      },
    });

    return agents.map((a) => ({
      id: `agent:${a.id}`,
      type: "agent",
      name: a.name,
      content: truncate(renderAgentContent(a)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("agent")) return [];

    const agents = await prisma.agent.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { longDescription: { contains: keyword, mode: "insensitive" } },
          { key: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        skills: {
          select: {
            name: true,
            description: true,
            isEnabled: true,
            category: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        tools: {
          select: {
            name: true,
            description: true,
            isEnabled: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        tierAccess: {
          include: { tier: { select: { name: true } } },
        },
      },
      take,
    });

    return agents.map((a) => ({
      id: `agent:${a.id}`,
      type: "agent",
      name: a.name,
      content: truncate(renderAgentContent(a)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const agents = await prisma.agent.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        description: true,
        iconUrl: true,
        category: true,
        status: true,
        version: true,
        _count: { select: { skills: true, tools: true } },
      },
    });

    return agents.map((a) => ({
      id: `agent:${a.id}`,
      type: "agent",
      name: a.name,
      description: a.description,
      imageUrl: a.iconUrl,
      status: a.status,
      category: a.category,
      meta: {
        version: a.version,
        skillCount: a._count.skills,
        toolCount: a._count.tools,
      },
    }));
  }
}
