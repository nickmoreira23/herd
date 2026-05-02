import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";
import { executeSearch } from "./tools/search";
import { executeFetch } from "./tools/fetch";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "herd-docs-mcp",
      version: "0.1.0",
    },
    {
      instructions:
        "Read-only access to HERD's Handbook. Use 'search' to find feature UIDs by query, then 'fetch' to retrieve full Markdown content of an entry. UIDs follow the format 'herd.<level>.<id>' where level is one of: corporate-network, solution, tool, block, foundation, integration.",
    },
  );

  server.registerTool(
    "search",
    {
      title: "Search HERD Handbook",
      description:
        "Search HERD's Handbook for features, blocks, tools, foundations, integrations matching a query. Returns up to 20 ranked results with UIDs, titles, and short descriptions. Use the returned 'id' field with the 'fetch' tool to retrieve full content.",
      inputSchema: {
        query: z.string().min(1).describe("Search query (free text)"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ query }) => {
      const result = executeSearch(query);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        // SDK constraint: structuredContent must be Record<string, unknown>.
        // Our domain types are structurally compatible but lack the index signature
        // required by the static type. Cast at the SDK boundary is the right tradeoff
        // — keeps domain types precise.
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch HERD Handbook entry",
      description:
        "Fetch the full Markdown content and metadata of a HERD Handbook entry by its UID (e.g., 'herd.block.contacts', 'herd.foundation.handbook'). Returns title, full body text, canonical URL, and structured metadata including pt-BR translations.",
      inputSchema: {
        id: z
          .string()
          .min(1)
          .describe("Feature UID in the form 'herd.<level>.<id>'"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = executeFetch(id);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result as unknown as Record<string, unknown>,
      };
    },
  );

  return server;
}
