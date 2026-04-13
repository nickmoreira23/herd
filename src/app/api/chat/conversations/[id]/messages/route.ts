import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { sendMessageSchema } from "@/lib/validators/chat";
import {
  getDataCatalog,
  searchData,
  getArtifactMetaForSources,
  SEARCH_DATA_TOOL,
} from "@/lib/chat/data-retrieval";
import {
  EXECUTE_ACTION_TOOL,
  executeAction,
  formatActionResult,
} from "@/lib/chat/action-execution";
import { buildActionCatalog, actionToBlock } from "@/lib/blocks/registry";
import { buildSolutionActionCatalog } from "@/lib/solutions/registry";
import { resolveAnthropicKey } from "@/lib/integrations";

const ORCHESTRATOR_KEY = "orchestrator";

// Fallback system prompt base if no agent record exists
const DEFAULT_SYSTEM_PROMPT_BASE = `You are HERD AI, the intelligent assistant for HERD OS — a subscription operations platform. You have access to the company's knowledge base, operational foundation data, AND the ability to take actions across all blocks.`;

async function buildSystemPrompt(catalog: string, actionCatalog: string): Promise<string> {
  // Load orchestrator agent's system prompt from DB if available
  let basePrompt = DEFAULT_SYSTEM_PROMPT_BASE;
  try {
    const agent = await prisma.agent.findUnique({
      where: { key: ORCHESTRATOR_KEY },
      select: { systemPrompt: true },
    });
    if (agent?.systemPrompt) {
      basePrompt = agent.systemPrompt;
    }
  } catch {
    // Fall back to default
  }

  return `${basePrompt}

Your role:
- Answer questions using the company's knowledge base and foundation data
- Knowledge base: documents, images, videos, audio, web pages, RSS articles, tables, forms, health data
- Foundation data: products, AI agents, perks, community benefits, partner brands
- Take actions: create, update, delete, and manage data across all blocks when requested
- Provide detailed, well-structured answers with citations to specific sources
- If you cannot find the answer, say so clearly — do NOT make up information
- You do NOT have access to the internet or web search

How to work:
1. Review the data catalog below to see what's available
2. When you need content from specific items, use the search_data tool with their IDs
3. When you need to find information by topic, use the search_data tool with a keyword
4. When the user wants to create, update, delete, or perform operations, use the execute_action tool
5. You can make multiple tool calls to gather information and then take action
6. Always cite which sources you used in your response

RULES FOR ACTIONS:
- For destructive actions (delete, bulk delete), ALWAYS describe what will happen and ask the user to confirm before executing
- For create operations, gather all required fields before executing — ask the user if any required info is missing
- For updates, retrieve the current state first using search_data, then apply changes
- Report the result clearly, including any created/updated IDs
- If an action fails, explain the error and suggest how to fix it
- You can chain actions across blocks (e.g., create an event then link it to a meeting)

IMPORTANT — Inline artifact cards:
When you reference a specific item (product, agent, document, etc.) in your response, insert an artifact marker on its own line immediately after your text about that item. The marker format is:

[[artifact:TYPE:ID]]

For example, if you retrieved a product with ID "product:abc-123", write your description of it and then place the marker on its own line:

This is our flagship pre-workout formula with high-stim energy and nootropic focus.
[[artifact:product:abc-123]]

Rules for artifact markers:
- Place each marker on its OWN line (not inline with text)
- Place it AFTER your text about that item, not before
- Use the exact ID from the tool results (the value in square brackets like [product:abc-123])
- One marker per item — do not repeat the same marker
- When listing multiple items, put text about each item followed by its marker before moving to the next
- Do NOT skip markers — every referenced item should have one

${catalog}

=== AVAILABLE ACTIONS ===
You can perform the following operations using the execute_action tool. Pass the action name and its parameters.

${actionCatalog}

=== SOLUTION TOOLS ===
Higher-level business tools that compose block actions for specific goals like financial projections, legal contracts, marketing campaigns, and sales pipeline management.

${buildSolutionActionCatalog()}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  let anthropic: Anthropic;
  try {
    const apiKey = await resolveAnthropicKey();
    anthropic = new Anthropic({ apiKey });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "API key not configured", 500);
  }

  const { id } = await params;

  const conversation = await prisma.chatConversation.findUnique({
    where: { id, userId },
  });
  if (!conversation) return apiError("Conversation not found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || "Validation error", 400);
  }

  const { content } = parsed.data;

  // Save user message
  await prisma.chatMessage.create({
    data: {
      conversationId: id,
      role: "user",
      content,
    },
  });

  // Load conversation history (last 30 messages)
  const history = await prisma.chatMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { role: true, content: true },
  });

  // Build knowledge catalog and action catalog
  const catalog = await getDataCatalog();
  const actionCatalog = buildActionCatalog();
  const systemPrompt = await buildSystemPrompt(catalog, actionCatalog);

  // Build messages for Anthropic
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (streamClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          streamClosed = true;
        }
      }

      let fullResponse = "";
      const allSources: Array<{ type: string; id: string; name: string }> = [];
      let allArtifactsMeta: Awaited<ReturnType<typeof getArtifactMetaForSources>> = [];
      let toolCallCount = 0;

      try {
        // Tool-use loop: Claude may call search_knowledge multiple times
        let currentMessages = [...messages];
        let continueLoop = true;
        let pendingAnalyzeStep: string | null = null;

        while (continueLoop) {
          if (toolCallCount > 0) {
            const analyzeId = `step-analyze-${toolCallCount}`;
            pendingAnalyzeStep = analyzeId;
            send("step", {
              id: analyzeId,
              phase: "analyzing",
              text: "Analyzing results...",
            });
          }

          const response = anthropic.messages.stream({
            model: conversation.model,
            max_tokens: 8192,
            system: systemPrompt,
            tools: [SEARCH_DATA_TOOL, EXECUTE_ACTION_TOOL],
            messages: currentMessages,
          });

          let toolUseBlock: { id: string; name: string; input: string } | null = null;
          let currentTextDelta = "";

          for await (const event of response) {
            if (streamClosed) break;

            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                toolUseBlock = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: "",
                };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                // Complete pending analyze step on first text token
                if (pendingAnalyzeStep) {
                  send("step_complete", {
                    id: pendingAnalyzeStep,
                    resultText: "Complete",
                  });
                  pendingAnalyzeStep = null;
                }
                currentTextDelta += event.delta.text;
                fullResponse += event.delta.text;
                send("token", { text: event.delta.text });
              } else if (
                event.delta.type === "input_json_delta" &&
                toolUseBlock
              ) {
                toolUseBlock.input += event.delta.partial_json;
              }
            } else if (event.type === "message_delta") {
              if (event.delta.stop_reason === "tool_use" && toolUseBlock) {
                // Complete pending analyze step before starting tool execution
                if (pendingAnalyzeStep) {
                  send("step_complete", {
                    id: pendingAnalyzeStep,
                    resultText: "Complete",
                  });
                  pendingAnalyzeStep = null;
                }

                // Execute tool call
                let toolInput: Record<string, unknown>;
                try {
                  toolInput = JSON.parse(toolUseBlock.input);
                } catch {
                  toolInput = {};
                }

                toolCallCount++;
                const stepId = `step-${toolCallCount}`;
                let toolResultContent: string;

                if (toolUseBlock.name === "execute_action") {
                  // ─── Block Action Execution ──────────────────────
                  const actionName = toolInput.action as string;
                  const actionParams = (toolInput.params as Record<string, unknown>) || {};

                  send("step", {
                    id: stepId,
                    phase: "executing",
                    text: `Executing ${actionName}...`,
                  });

                  const actionResult = await executeAction(
                    actionName,
                    actionParams,
                    userId
                  );

                  send("step_complete", {
                    id: stepId,
                    resultText: actionResult.success
                      ? `${actionName} succeeded`
                      : `${actionName} failed: ${actionResult.error}`,
                  });

                  // Emit activity event for successful mutations
                  if (actionResult.success) {
                    const entry = actionToBlock.get(actionName);
                    if (entry) {
                      const actionType = entry.action.method === "DELETE"
                        ? "deleted"
                        : entry.action.method === "POST"
                          ? "created"
                          : "updated";
                      send("activity", {
                        type: actionType,
                        label: `${actionType} via ${actionName}`,
                        blockName: entry.block.name,
                      });
                    }
                  }

                  toolResultContent = formatActionResult(actionResult);
                } else {
                  // ─── Data Search (search_data) ───────────────────
                  const typedInput = toolInput as {
                    item_ids?: string[];
                    keyword?: string;
                    types?: string[];
                  };

                  if (typedInput.item_ids && typedInput.item_ids.length > 0) {
                    send("step", {
                      id: stepId,
                      phase: "retrieving",
                      text: `Retrieving ${typedInput.item_ids.length} item${typedInput.item_ids.length > 1 ? "s" : ""}...`,
                    });
                  } else if (typedInput.keyword) {
                    const typeFilter = typedInput.types?.length
                      ? ` in ${typedInput.types.join(", ")}`
                      : "";
                    send("step", {
                      id: stepId,
                      phase: "searching",
                      text: `Searching for "${typedInput.keyword}"${typeFilter}...`,
                    });
                  } else {
                    send("step", {
                      id: stepId,
                      phase: "searching",
                      text: "Searching data...",
                    });
                  }

                  const results = await searchData(typedInput);

                  // Track new sources from this call
                  const newSources: Array<{ type: string; id: string; name: string }> = [];
                  for (const r of results) {
                    if (!allSources.find((s) => s.id === r.id)) {
                      const source = { type: r.type, id: r.id, name: r.name };
                      allSources.push(source);
                      newSources.push(source);
                    }
                  }

                  send("step_complete", {
                    id: stepId,
                    resultText: results.length > 0
                      ? `Found ${results.length} result${results.length > 1 ? "s" : ""}`
                      : "No results found",
                  });

                  // Progressive artifact loading
                  if (newSources.length > 0) {
                    try {
                      const newArtifacts = await getArtifactMetaForSources(newSources);
                      if (newArtifacts.length > 0) {
                        allArtifactsMeta = [...allArtifactsMeta, ...newArtifacts];
                        send("artifacts", allArtifactsMeta);
                      }
                    } catch (e) {
                      console.error("Progressive artifact fetch failed:", e);
                    }
                  }

                  toolResultContent =
                    results.length > 0
                      ? results
                          .map(
                            (r) =>
                              `=== ${r.type.toUpperCase()}: ${r.name} [${r.id}] ===\n${r.content}`
                          )
                          .join("\n\n")
                      : "No results found for the given search.";
                }

                // Continue conversation with tool result
                currentMessages = [
                  ...currentMessages,
                  {
                    role: "assistant" as const,
                    content: [
                      ...(currentTextDelta
                        ? [
                            {
                              type: "text" as const,
                              text: currentTextDelta,
                            },
                          ]
                        : []),
                      {
                        type: "tool_use" as const,
                        id: toolUseBlock.id,
                        name: toolUseBlock.name,
                        input: toolInput,
                      },
                    ],
                  },
                  {
                    role: "user" as const,
                    content: [
                      {
                        type: "tool_result" as const,
                        tool_use_id: toolUseBlock.id,
                        content: toolResultContent,
                      },
                    ],
                  },
                ];

                // Reset for next iteration
                currentTextDelta = "";
                break; // break out of for-await to start new stream
              } else if (event.delta.stop_reason === "end_turn") {
                // Complete any pending analyze step
                if (pendingAnalyzeStep) {
                  send("step_complete", {
                    id: pendingAnalyzeStep,
                    resultText: "Complete",
                  });
                  pendingAnalyzeStep = null;
                }
                continueLoop = false;
                break; // break out of for-await immediately
              }
            }
          }

          // If no tool use triggered and stream ended, exit loop
          if (!toolUseBlock && continueLoop) {
            // Complete any pending analyze step
            if (pendingAnalyzeStep) {
              send("step_complete", {
                id: pendingAnalyzeStep,
                resultText: "Complete",
              });
              pendingAnalyzeStep = null;
            }
            continueLoop = false;
          }
          // Reset toolUseBlock after the check
          toolUseBlock = null;
        }

        // Send final sources (artifacts were already sent progressively)
        if (allSources.length > 0) {
          send("sources", allSources);
        }

        // Save assistant message
        await prisma.chatMessage.create({
          data: {
            conversationId: id,
            role: "assistant",
            content: fullResponse,
            model: conversation.model,
            sources:
              allSources.length > 0 ? allSources : undefined,
            artifacts:
              allArtifactsMeta.length > 0 ? JSON.parse(JSON.stringify(allArtifactsMeta)) : undefined,
          },
        });

        // Auto-generate title on first exchange (2 messages = first user + first assistant)
        const messageCount = await prisma.chatMessage.count({
          where: { conversationId: id },
        });
        if (messageCount === 2 && !conversation.title) {
          try {
            const titleResponse = await anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 50,
              messages: [
                {
                  role: "user",
                  content: `Generate a very short title (3-6 words, no quotes) for a conversation that starts with this message: "${content.slice(0, 200)}"`,
                },
              ],
            });

            const titleBlock = titleResponse.content.find(
              (b) => b.type === "text"
            );
            if (titleBlock && titleBlock.type === "text") {
              const title = titleBlock.text.trim().slice(0, 200);
              await prisma.chatConversation.update({
                where: { id },
                data: { title },
              });
              send("title", { title });
            }
          } catch (e) {
            console.error("Failed to generate title:", e);
          }
        }

        // Update conversation timestamp
        await prisma.chatConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        send("done", {});
      } catch (err) {
        console.error("Chat streaming error:", err);
        send("error", {
          message:
            err instanceof Error ? err.message : "An error occurred",
        });
      } finally {
        if (!streamClosed) {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
