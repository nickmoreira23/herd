import Anthropic from "@anthropic-ai/sdk";
import type { Agent, AgentTool } from "@prisma/client";
import {
  loadHistory,
  saveUserMessage,
  saveAssistantMessage,
} from "./conversation";
import { buildSystemPrompt, type AgentWithRelations } from "./prompt-builder";
import {
  type Attachment,
  buildMultimodalContent,
} from "./media-processor";
import {
  getMultimodalTools,
  handleMultimodalToolCall,
} from "./tools";

// ─── Types ─────────────────────────────────────────────────────

export type SendFn = (event: string, data: unknown) => void;

export interface AgentStreamParams {
  /** Agent record with tools, skills, knowledge loaded */
  agent: AgentWithRelations & { tools: AgentTool[] };
  /** Conversation ID (already found/created) */
  conversationId: string;
  /** User's message content */
  userMessage: string;
  /** Anthropic client instance */
  anthropic: Anthropic;
  /** Additional Anthropic tools (e.g. scoped search_data/execute_action for block agents) */
  extraTools?: Anthropic.Tool[];
  /** Extra context appended to system prompt (e.g. plan list, block catalog) */
  extraSystemPrompt?: string;
  /**
   * Custom tool call handler. Return string result if handled, or null to
   * fall back to default AgentTool HTTP execution.
   */
  onToolCall?: (
    name: string,
    input: Record<string, unknown>,
    send: SendFn
  ) => Promise<string | null>;
  /** Optional file attachments for multimodal input */
  attachments?: Attachment[];
}

// ─── Convert AgentTool DB records to Anthropic format ──────────

function agentToolToAnthropic(tool: AgentTool): Anthropic.Tool | null {
  if (!tool.isEnabled || !tool.toolSchema) return null;

  return {
    name: tool.key,
    description: tool.description || tool.name,
    input_schema: tool.toolSchema as Anthropic.Tool["input_schema"],
  };
}

// ─── Default tool execution via HTTP ───────────────────────────

async function executeToolViaHttp(
  tool: AgentTool,
  input: Record<string, unknown>
): Promise<string> {
  if (!tool.endpointUrl) {
    return `Error: Tool "${tool.key}" has no endpoint configured.`;
  }

  try {
    const method = tool.httpMethod || "POST";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(tool.headers as Record<string, string> | null),
    };

    // Add auth if configured
    if (tool.authType !== "NONE" && tool.authConfig) {
      const config = tool.authConfig as Record<string, string>;
      if (tool.authType === "BEARER_TOKEN" && config.token) {
        headers.Authorization = `Bearer ${config.token}`;
      } else if (tool.authType === "API_KEY" && config.key && config.header) {
        headers[config.header] = config.key;
      }
    }

    const fetchOpts: RequestInit = { method, headers };
    if (method !== "GET" && method !== "HEAD") {
      fetchOpts.body = JSON.stringify(input);
    }

    const res = await fetch(tool.endpointUrl, fetchOpts);
    const text = await res.text();

    if (!res.ok) {
      return `Error (${res.status}): ${text.slice(0, 500)}`;
    }

    return text.slice(0, 5000); // Cap response size
  } catch (err) {
    return `Error calling tool: ${err instanceof Error ? err.message : "Unknown error"}`;
  }
}

// ─── Create Agent Stream ───────────────────────────────────────

/**
 * The shared streaming engine for all agents.
 *
 * 1. Saves user message to DB
 * 2. Loads conversation history
 * 3. Builds system prompt from agent config + extras
 * 4. Streams Anthropic response with tool-use loop
 * 5. Emits SSE events: token, step, step_complete, activity, error, done
 * 6. Saves assistant message to DB after streaming
 */
export function createAgentStream(params: AgentStreamParams): ReadableStream {
  const {
    agent,
    conversationId,
    userMessage,
    anthropic,
    extraTools = [],
    extraSystemPrompt,
    onToolCall,
    attachments = [],
  } = params;

  const model = agent.modelId || "claude-sonnet-4-20250514";
  const maxTokens = agent.maxTokens || 8192;
  const historyWindow = agent.historyWindow || 30;

  // Build tool list: DB-defined tools + extra tools + multimodal tools (from agent flags)
  const dbTools = agent.tools
    .map(agentToolToAnthropic)
    .filter((t): t is Anthropic.Tool => t !== null);
  const multimodalTools = getMultimodalTools(agent);
  const allTools = [...dbTools, ...extraTools, ...multimodalTools];

  // Build system prompt
  const systemPrompt = buildSystemPrompt(agent, extraSystemPrompt);

  // Build tool key → AgentTool map for HTTP fallback
  const toolMap = new Map(agent.tools.map((t) => [t.key, t]));

  const encoder = new TextEncoder();
  let streamClosed = false;

  return new ReadableStream({
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

      try {
        // 1. Save user message
        await saveUserMessage(conversationId, userMessage);

        // 2. Load history
        const history = await loadHistory(conversationId, historyWindow);

        // Build messages — last message may have multimodal content
        const historyMessages: Anthropic.MessageParam[] = history.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // The last message is the one we just saved — possibly with attachments
        let lastMessageContent: Anthropic.ContentBlockParam[] | string = userMessage;
        if (attachments.length > 0) {
          try {
            lastMessageContent = await buildMultimodalContent(
              userMessage,
              attachments,
              agent
            );
          } catch (err) {
            console.error(`[${agent.key}] Attachment processing error:`, err);
            // Fall back to text-only
          }
        }

        const messages: Anthropic.MessageParam[] = [
          ...historyMessages,
          { role: "user" as const, content: lastMessageContent },
        ];

        // 3. Streaming tool-use loop
        let currentMessages = [...messages];
        let continueLoop = true;

        while (continueLoop) {
          const response = anthropic.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            ...(allTools.length > 0 ? { tools: allTools } : {}),
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
                send("step", { text: `Using ${event.content_block.name}...` });
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
                let toolInput: Record<string, unknown>;
                try {
                  toolInput = JSON.parse(toolUseBlock.input);
                } catch {
                  toolInput = {};
                }

                // Execute tool: custom handler → multimodal handler → HTTP fallback
                let toolResult: string;
                const customResult = onToolCall
                  ? await onToolCall(toolUseBlock.name, toolInput, send)
                  : null;

                if (customResult !== null && customResult !== undefined) {
                  toolResult = customResult;
                } else {
                  // Try multimodal tool handler
                  const multimodalResult = await handleMultimodalToolCall(
                    toolUseBlock.name,
                    toolInput,
                    send,
                    anthropic
                  );

                  if (multimodalResult !== null) {
                    toolResult = multimodalResult;
                  } else {
                    // Fall back to HTTP execution via AgentTool record
                    const dbTool = toolMap.get(toolUseBlock.name);
                    if (dbTool) {
                      toolResult = await executeToolViaHttp(dbTool, toolInput);
                    } else {
                      toolResult = `Unknown tool: ${toolUseBlock.name}`;
                    }
                  }
                }

                send("step_complete", {
                  text: `${toolUseBlock.name} completed`,
                });

                // Append tool use + result to messages for next loop
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
                        content: toolResult,
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

        // 4. Save assistant message
        if (fullResponse) {
          await saveAssistantMessage(conversationId, fullResponse, model);
        }

        send("done", {});
      } catch (err) {
        console.error(`[${agent.key}] Agent streaming error:`, err);
        send("error", {
          message: err instanceof Error ? err.message : "An error occurred",
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
}

// ─── SSE Response Helper ───────────────────────────────────────

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
