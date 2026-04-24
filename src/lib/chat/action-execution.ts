import { actionToBlock } from "../blocks/registry";
import { toolActionToSolution } from "../solutions/registry";

// ─── Types ─────────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  action: string;
  block: string;
  data?: unknown;
  error?: string;
}

// ─── Tool Definition (for Anthropic API) ───────────────────────────

export const EXECUTE_ACTION_TOOL = {
  name: "execute_action",
  description:
    "Execute a block action — create, update, delete, or perform operations on HERD OS data. Use this when the user wants to make changes or perform actions beyond reading data.",
  input_schema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string" as const,
        description:
          "The action name from the available actions list (e.g. 'create_product', 'sync_calendars', 'delete_meeting')",
      },
      params: {
        type: "object" as const,
        description:
          "The parameters for the action, matching the action's required and optional fields",
      },
    },
    required: ["action", "params"],
  },
};

// ─── Execution Engine ──────────────────────────────────────────────

/**
 * Executes a block action by routing to the correct API endpoint.
 * Uses internal fetch so all validation, auth, and business logic
 * in the API routes is reused — no duplication.
 */
export async function executeAction(
  actionName: string,
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {
  // Check block actions first
  const entry = actionToBlock.get(actionName);

  // Check solution tool actions if not a block action
  if (!entry) {
    const toolEntry = toolActionToSolution.get(actionName);
    if (!toolEntry) {
      return {
        success: false,
        action: actionName,
        block: "unknown",
        error: `Unknown action: "${actionName}". Check the available actions list.`,
      };
    }

    const { solution, action: toolAction } = toolEntry;

    // If the tool action composes block actions, execute them in sequence
    if (toolAction.blockActions && toolAction.blockActions.length > 0) {
      const results: ActionResult[] = [];
      for (const blockActionName of toolAction.blockActions) {
        const result = await executeAction(blockActionName, params, userId);
        results.push(result);
        if (!result.success) break;
      }
      return {
        success: results.every((r) => r.success),
        action: actionName,
        block: solution.name,
        data: results.length === 1 ? results[0].data : results.map((r) => r.data),
        error: results.find((r) => !r.success)?.error,
      };
    }

    // If the tool action has its own endpoint, handle it like a block action
    if (toolAction.endpoint && toolAction.method) {
      // Reuse the same execution logic below by creating a compatible entry
      const syntheticBlock = { name: solution.name } as const;
      const syntheticAction = {
        endpoint: toolAction.endpoint,
        method: toolAction.method,
        name: toolAction.name,
        description: toolAction.description,
        parametersSchema: toolAction.parametersSchema,
        responseDescription: toolAction.responseDescription,
      };
      // Fall through to the standard execution path
      return executeBlockAction(actionName, syntheticBlock.name, syntheticAction, params, userId);
    }

    return {
      success: false,
      action: actionName,
      block: solution.name,
      error: `Tool action "${actionName}" has no endpoint or block actions configured.`,
    };
  }

  const { block, action } = entry;
  return executeBlockAction(actionName, block.name, action, params, userId);
}

/**
 * Executes a single action by routing to an API endpoint.
 */
async function executeBlockAction(
  actionName: string,
  blockName: string,
  action: { endpoint: string; method: string },
  params: Record<string, unknown>,
  userId: string
): Promise<ActionResult> {

  // Build the URL, replacing path params like {id}
  let path = action.endpoint;
  for (const [key, value] of Object.entries(params)) {
    if (path.includes(`{${key}}`)) {
      path = path.replace(`{${key}}`, String(value));
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const isGet = action.method === "GET";

  // For GET requests, convert params to query string
  let fullUrl = `${baseUrl}${path}`;
  if (isGet && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      // Skip path params that were already substituted
      if (action.endpoint.includes(`{${key}}`)) continue;
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) fullUrl += `?${qs}`;
  }

  // Build request
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Internal-Agent": "herd-ai",
    "X-Agent-User-Id": userId,
  };

  const fetchOptions: RequestInit = {
    method: action.method,
    headers,
  };

  // For methods with bodies, include params (minus path params)
  if (["POST", "PATCH", "PUT"].includes(action.method)) {
    const bodyParams = { ...params };
    for (const key of Object.keys(params)) {
      if (action.endpoint.includes(`{${key}}`)) {
        delete bodyParams[key];
      }
    }
    fetchOptions.body = JSON.stringify(bodyParams);
  }

  try {
    const response = await fetch(fullUrl, fetchOptions);
    let json: Record<string, unknown>;
    try {
      json = await response.json();
    } catch {
      json = {};
    }

    if (!response.ok) {
      const baseError =
        (json.error as string) ||
        `HTTP ${response.status}: ${response.statusText}`;
      const details = json.details
        ? ` — ${JSON.stringify(json.details)}`
        : "";
      return {
        success: false,
        action: actionName,
        block: blockName,
        error: `${baseError}${details}`,
      };
    }

    return {
      success: true,
      action: actionName,
      block: blockName,
      data: json.data ?? json,
    };
  } catch (err) {
    return {
      success: false,
      action: actionName,
      block: blockName,
      error: err instanceof Error ? err.message : "Unknown error during action execution",
    };
  }
}

/**
 * Formats an ActionResult as text for the LLM tool_result.
 */
export function formatActionResult(result: ActionResult): string {
  if (result.success) {
    const dataStr =
      result.data !== undefined
        ? `\nData: ${JSON.stringify(result.data, null, 2)}`
        : "";
    return `Action: ${result.action} (${result.block} block)\nResult: Success${dataStr}`;
  }
  return `Action: ${result.action} (${result.block} block)\nResult: Failed\nError: ${result.error}`;
}
