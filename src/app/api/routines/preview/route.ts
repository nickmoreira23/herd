import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { resolveAnthropicKey } from "@/lib/integration-keys";
import { renderTemplate } from "@/lib/routines/runner";

const previewSchema = z.object({
  agentId: z.string().uuid(),
  promptTemplate: z.string().min(1),
  input: z.unknown().optional(),
  outputFormat: z.enum(["text", "json", "markdown"]).optional(),
  /**
   * If true, only do the local template render (no LLM call). Cheaper preview
   * for the wizard's "show me what would be sent" panel.
   */
  renderOnly: z.boolean().optional(),
});

const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Dry-run a routine before saving it. The wizard hits this from step 5 to
 * preview both the rendered prompt and (optionally) the agent's response.
 *
 * Nothing is persisted — no Routine, no RoutineRun. Token usage and elapsed
 * time are returned so the admin sees what the routine would cost.
 */
export async function POST(request: Request) {
  const result = await parseAndValidate(request, previewSchema);
  if ("error" in result) return result.error;

  const { agentId, promptTemplate, input, outputFormat, renderOnly } = result.data;

  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) return apiError("Agent not found", 404);

    const renderedPrompt = renderTemplate(
      promptTemplate,
      (input ?? {}) as Record<string, unknown>
    );

    if (renderOnly) {
      return apiSuccess({
        renderedPrompt,
        systemPrompt: agent.systemPrompt ?? null,
        model: agent.modelId || DEFAULT_MODEL,
      });
    }

    const apiKey = await resolveAnthropicKey();
    const anthropic = new Anthropic({ apiKey });
    const start = Date.now();

    const response = await anthropic.messages.create({
      model: agent.modelId || DEFAULT_MODEL,
      max_tokens: agent.maxTokens ?? 2048,
      ...(agent.temperature == null
        ? {}
        : { temperature: Number(agent.temperature) }),
      ...(agent.systemPrompt ? { system: agent.systemPrompt } : {}),
      messages: [{ role: "user", content: renderedPrompt }],
    });

    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    let parsedJson: unknown = null;
    if (outputFormat === "json") {
      try {
        parsedJson = JSON.parse(text);
      } catch {
        /* leave null */
      }
    }

    return apiSuccess({
      renderedPrompt,
      systemPrompt: agent.systemPrompt ?? null,
      model: agent.modelId || DEFAULT_MODEL,
      output: text,
      outputJson: parsedJson,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      durationMs: Date.now() - start,
    });
  } catch (e) {
    console.error("POST /api/routines/preview error:", e);
    const message = e instanceof Error ? e.message : "Failed to preview";
    return apiError(message, 500);
  }
}
