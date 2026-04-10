import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { resolveAnthropicKey } from "@/lib/integrations";
import { blockRegistry, actionToBlock } from "@/lib/blocks/registry";
import {
  searchData,
  SEARCH_DATA_TOOL,
} from "@/lib/chat/data-retrieval";
import {
  EXECUTE_ACTION_TOOL,
  executeAction,
  formatActionResult,
} from "@/lib/chat/action-execution";

// ─── System Prompt Builder ─────────────────────────────────────

function buildBlockSystemPrompt(
  blockName: string,
  displayName: string,
  description: string,
  actionCatalog: string
): string {
  return `You are the ${displayName} Agent — a specialist AI assistant for the ${displayName} block in HERD OS, a subscription operations platform.

IMPORTANT BOUNDARIES:
- You ONLY answer questions about ${displayName.toLowerCase()} and data within this block.
- If the user asks about something outside your scope (other blocks, general questions, unrelated topics), politely tell them: "I'm the ${displayName} specialist. I can only help with ${displayName.toLowerCase()}-related questions. For other topics, please use the main HERD AI chat."
- Do NOT make up information. If you don't know, say so.

Your domain: ${description}

How to work:
1. Use the search_data tool to find ${displayName.toLowerCase()} data by keyword or specific IDs
2. Use the execute_action tool to create, update, or manage ${displayName.toLowerCase()} data when the user asks
3. Always be specific and cite data you retrieved
4. For destructive actions (delete), always confirm with the user first

RULES FOR ACTIONS:
- Only use actions that belong to the "${blockName}" block (listed below)
- For create operations, gather all required fields before executing
- For updates, retrieve the current state first, then apply changes
- Report results clearly

=== AVAILABLE ACTIONS ===
${actionCatalog}`;
}

// ─── Request Schema ────────────────────────────────────────────

interface BlockMessageRequest {
  content: string;
  history?: Array<{ role: string; content: string }>;
}

// ─── Route Handler ─────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ blockName: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  let anthropic: Anthropic;
  try {
    const apiKey = await resolveAnthropicKey();
    anthropic = new Anthropic({ apiKey });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "API key not configured",
      500
    );
  }

  const { blockName } = await params;

  // Validate block exists
  const block = blockRegistry.get(blockName);
  if (!block) {
    return apiError(`Unknown block: ${blockName}`, 404);
  }

  let body: BlockMessageRequest;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (!body.content?.trim()) {
    return apiError("Message content is required", 400);
  }

  // Build block-scoped action catalog (only this block's actions)
  const actionLines = block.actions.map((a) => {
    const required = a.requiredFields?.length
      ? ` (required: ${a.requiredFields.join(", ")})`
      : "";
    return `  - ${a.name}: ${a.description}${required}`;
  });
  const actionCatalog = `${block.displayName} [${block.name}]:\n${actionLines.join("\n")}`;

  const systemPrompt = buildBlockSystemPrompt(
    block.name,
    block.displayName,
    block.description,
    actionCatalog
  );

  // Build messages — use provided history + new message
  const historyMessages: Anthropic.MessageParam[] = (body.history || []).map(
    (m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })
  );

  // Scope the search_data tool to only this block's types
  const scopedSearchTool = {
    ...SEARCH_DATA_TOOL,
    description: `Search for ${block.displayName.toLowerCase()} data by keyword or specific item IDs. Only searches within the ${block.displayName} block.`,
    input_schema: {
      ...SEARCH_DATA_TOOL.input_schema,
      properties: {
        ...SEARCH_DATA_TOOL.input_schema.properties,
        types: {
          type: "array" as const,
          items: {
            type: "string" as const,
            enum: block.types,
          },
          description: `Data types to search (defaults to all ${block.displayName} types)`,
        },
      },
    },
  };

  // Scope the execute_action tool to only this block's actions
  const blockActionNames = block.actions.map((a) => a.name);
  const scopedActionTool = {
    ...EXECUTE_ACTION_TOOL,
    description: `Execute a ${block.displayName} block action — create, update, delete, or perform operations on ${block.displayName.toLowerCase()} data.`,
    input_schema: {
      ...EXECUTE_ACTION_TOOL.input_schema,
      properties: {
        ...EXECUTE_ACTION_TOOL.input_schema.properties,
        action: {
          type: "string" as const,
          enum: blockActionNames,
          description: `The action to execute (must be a ${block.displayName} action)`,
        },
      },
    },
  };

  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (streamClosed) return;
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {
          streamClosed = true;
        }
      }

      let fullResponse = "";

      try {
        let currentMessages = [...historyMessages];
        let continueLoop = true;

        while (continueLoop) {
          const response = anthropic.messages.stream({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: systemPrompt,
            tools: [scopedSearchTool, scopedActionTool],
            messages: currentMessages,
          });

          let toolUseBlock: {
            id: string;
            name: string;
            input: string;
          } | null = null;
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
                // Execute tool
                let toolInput: Record<string, unknown>;
                try {
                  toolInput = JSON.parse(toolUseBlock.input);
                } catch {
                  toolInput = {};
                }

                let toolResultContent: string;

                if (toolUseBlock.name === "execute_action") {
                  const actionName = toolInput.action as string;
                  const actionParams =
                    (toolInput.params as Record<string, unknown>) || {};

                  // Validate action belongs to this block
                  const entry = actionToBlock.get(actionName);
                  if (!entry || entry.block.name !== block.name) {
                    toolResultContent = `Error: Action "${actionName}" does not belong to the ${block.displayName} block. You can only use ${block.name} actions.`;
                  } else {
                    const result = await executeAction(
                      actionName,
                      actionParams,
                      userId
                    );
                    toolResultContent = formatActionResult(result);
                  }
                } else {
                  // search_data — force types to this block's types
                  const typedInput = toolInput as {
                    item_ids?: string[];
                    keyword?: string;
                    types?: string[];
                  };
                  if (!typedInput.types || typedInput.types.length === 0) {
                    typedInput.types = block.types;
                  }

                  const results = await searchData(typedInput);
                  toolResultContent =
                    results.length > 0
                      ? results
                          .map(
                            (r) =>
                              `=== ${r.type.toUpperCase()}: ${r.name} [${r.id}] ===\n${r.content}`
                          )
                          .join("\n\n")
                      : "No results found.";
                }

                // Continue with tool result
                currentMessages = [
                  ...currentMessages,
                  {
                    role: "assistant" as const,
                    content: [
                      ...(currentTextDelta
                        ? [{ type: "text" as const, text: currentTextDelta }]
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

                currentTextDelta = "";
                break;
              } else if (event.delta.stop_reason === "end_turn") {
                continueLoop = false;
                break;
              }
            }
          }

          if (!toolUseBlock && continueLoop) {
            continueLoop = false;
          }
          toolUseBlock = null;
        }

        send("done", {});
      } catch (err) {
        console.error("Block agent streaming error:", err);
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
