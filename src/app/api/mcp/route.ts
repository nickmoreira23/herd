/**
 * Streamable HTTP transport for the HERD MCP server.
 *
 * Same lifecycle as the stdio entrypoint (`mcp/index.ts`): it constructs the
 * `McpServer` from `mcp/server.ts` (search + fetch tools) and wires it to a
 * transport. The HTTP variant uses the SDK's web-standard transport which
 * accepts a `Request` and returns a `Response` — direct fit for Next.js
 * App Router route handlers.
 *
 * Stateless mode: each request gets a fresh server + transport. No session
 * IDs, no in-memory state across requests. Index data is module-level
 * cached inside the tools, so spinning up a fresh server is cheap.
 *
 * Auth: bearer token from env `MCP_HTTP_TOKEN`. Day-1 simple shared secret;
 * OAuth flow can come later if a client demands it.
 *
 * CORS: configured for ChatGPT web origins.
 */

import { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "../../../../mcp/server";

const REQUIRED_TOKEN = process.env.MCP_HTTP_TOKEN;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "https://chatgpt.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Mcp-Session-Id, Accept",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!REQUIRED_TOKEN) {
    return Response.json(
      { error: "MCP HTTP not configured (set MCP_HTTP_TOKEN env)" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${REQUIRED_TOKEN}`) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  const server = createServer();
  await server.connect(transport);

  const response = await transport.handleRequest(request);
  return withCors(response);
}
