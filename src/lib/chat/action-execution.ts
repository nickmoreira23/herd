import { actionToBlock } from "../blocks/registry";

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
  const entry = actionToBlock.get(actionName);
  if (!entry) {
    return {
      success: false,
      action: actionName,
      block: "unknown",
      error: `Unknown action: "${actionName}". Check the available actions list.`,
    };
  }

  const { block, action } = entry;

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
      return {
        success: false,
        action: actionName,
        block: block.name,
        error:
          (json.error as string) ||
          `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      action: actionName,
      block: block.name,
      data: json.data ?? json,
    };
  } catch (err) {
    return {
      success: false,
      action: actionName,
      block: block.name,
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
