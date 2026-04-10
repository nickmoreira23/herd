import { z } from "zod";
import {
  AGENT_STATUSES,
  AGENT_CATEGORIES,
  MODEL_TYPES,
  KNOWLEDGE_ITEM_TYPES,
  KNOWLEDGE_ITEM_STATUSES,
  AGENT_TOOL_AUTH_TYPES,
} from "@/types";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase snake_case"),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  category: z.enum(AGENT_CATEGORIES),
  icon: z.string().optional(),
  status: z.enum(AGENT_STATUSES).optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),

  // AI configuration
  modelType: z.enum(MODEL_TYPES).optional(),
  modelProvider: z.string().optional(),
  modelId: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxTokens: z.coerce.number().int().positive().optional(),

  // Image model config
  imageSize: z.string().optional(),
  imageStyle: z.string().optional(),
  imageQuality: z.string().optional(),

  // Video model config
  videoDuration: z.coerce.number().int().positive().optional(),
  videoResolution: z.string().optional(),
  videoAspectRatio: z.string().optional(),

  // Voice model config
  voiceId: z.string().optional(),
  voiceSpeed: z.coerce.number().min(0.25).max(4).optional(),
  voiceStability: z.coerce.number().min(0).max(1).optional(),

  // Rate limiting & cost
  dailyUsageLimit: z.coerce.number().int().positive().optional(),
  monthlyCostEstimate: z.coerce.number().nonnegative().optional(),
  avgTokensPerCall: z.coerce.number().int().positive().optional(),

  // Feature flags
  requiresMedia: z.boolean().optional(),
  requiresHealth: z.boolean().optional(),
  isConversational: z.boolean().optional(),

  // Response format
  responseFormat: z.string().optional(),

  // Metadata
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const agentTierAccessSchema = z.object({
  assignments: z.array(
    z.object({
      agentId: z.string().uuid(),
      isEnabled: z.boolean(),
      dailyUsageLimitOverride: z.coerce.number().int().positive().optional().nullable(),
      priorityAccess: z.boolean().optional(),
    })
  ),
});

// ─── Knowledge Item ──────────────────────────────────────────────────
export const createKnowledgeItemSchema = z.object({
  type: z.enum(KNOWLEDGE_ITEM_TYPES),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  fileKey: z.string().optional(),
  fileMimeType: z.string().optional(),
  fileSizeBytes: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(KNOWLEDGE_ITEM_STATUSES).optional(),
  metadata: z.any().optional(),
  priority: z.coerce.number().int().nonnegative().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});
export const updateKnowledgeItemSchema = createKnowledgeItemSchema.partial();

// ─── Agent Skill ─────────────────────────────────────────────────────
export const createAgentSkillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase snake_case"),
  description: z.string().optional(),
  promptFragment: z.string().optional(),
  isEnabled: z.boolean().optional(),
  requiresTools: z.array(z.string()).optional(),
  category: z.string().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});
export const updateAgentSkillSchema = createAgentSkillSchema.partial();

// ─── Agent Tool ──────────────────────────────────────────────────────
export const createAgentToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase snake_case"),
  description: z.string().optional(),
  toolSchema: z.any().optional(),
  endpointUrl: z.string().optional(),
  httpMethod: z.string().optional(),
  authType: z.enum(AGENT_TOOL_AUTH_TYPES).optional(),
  authConfig: z.any().optional(),
  headers: z.any().optional(),
  timeoutMs: z.coerce.number().int().positive().optional(),
  isEnabled: z.boolean().optional(),
  rateLimitPerMinute: z.coerce.number().int().positive().optional().nullable(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});
export const updateAgentToolSchema = createAgentToolSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type AgentTierAccessInput = z.infer<typeof agentTierAccessSchema>;
