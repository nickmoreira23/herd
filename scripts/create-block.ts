/**
 * Block Generator Script
 *
 * Scaffolds all required files for a new HERD block following the standard architecture.
 *
 * Usage:
 *   npx tsx scripts/create-block.ts --name "rewards" --display "Rewards" --model "Reward"
 *
 * Creates:
 *   - src/components/{name}/types.ts
 *   - src/components/{name}/{name}-client.tsx
 *   - src/app/admin/blocks/{name}/page.tsx
 *   - src/app/admin/blocks/{name}/loading.tsx
 *   - src/app/admin/blocks/{name}/[id]/page.tsx
 *   - src/app/api/{name}/route.ts
 *   - src/app/api/{name}/[id]/route.ts
 *   - src/lib/validators/{name}.ts
 *   - src/lib/chat/providers/{name}.provider.ts
 *   - src/lib/blocks/blocks/{name}.block.ts
 *   - .agents/blocks/{name}/AGENT.md
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ─── Parse args ────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const name = getArg("--name");
const display = getArg("--display");
const model = getArg("--model");

if (!name || !display || !model) {
  console.error(
    'Usage: npx tsx scripts/create-block.ts --name "rewards" --display "Rewards" --model "Reward"'
  );
  process.exit(1);
}

const root = join(__dirname, "..");
const pascal = model; // PascalCase model name
const camel = pascal[0].toLowerCase() + pascal.slice(1);

function ensure(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function write(path: string, content: string) {
  if (existsSync(path)) {
    console.log(`  SKIP (exists): ${path}`);
    return;
  }
  writeFileSync(path, content);
  console.log(`  CREATE: ${path}`);
}

console.log(`\nScaffolding block: ${display} (${name})\n`);

// ─── Components ────────────────────────────────────────────────────

const compDir = join(root, "src/components", name);
ensure(compDir);

write(
  join(compDir, "types.ts"),
  `export interface ${pascal}Row {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
`
);

write(
  join(compDir, `${name}-client.tsx`),
  `"use client";

import { useState } from "react";
import type { ${pascal}Row } from "./types";

interface ${pascal}ClientProps {
  initial${pascal}s: ${pascal}Row[];
}

export function ${pascal}Client({ initial${pascal}s }: ${pascal}ClientProps) {
  const [items] = useState(initial${pascal}s);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">${display}</h1>
      <p className="text-muted-foreground">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
`
);

// ─── Pages ─────────────────────────────────────────────────────────

const pageDir = join(root, "src/app/admin/blocks", name);
ensure(pageDir);
ensure(join(pageDir, "[id]"));

write(
  join(pageDir, "page.tsx"),
  `import { prisma } from "@/lib/prisma";
import { ${pascal}Client } from "@/components/${name}/${name}-client";

export default async function ${pascal}Page() {
  const items = await prisma.${camel}.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <${pascal}Client initial${pascal}s={serialized} />;
}
`
);

write(
  join(pageDir, "loading.tsx"),
  `export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="h-64 rounded bg-muted" />
    </div>
  );
}
`
);

write(
  join(pageDir, "[id]/page.tsx"),
  `import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ${pascal}DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await prisma.${camel}.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{item.name}</h1>
    </div>
  );
}
`
);

// ─── API Routes ────────────────────────────────────────────────────

const apiDir = join(root, "src/app/api", name);
ensure(apiDir);
ensure(join(apiDir, "[id]"));

write(
  join(apiDir, "route.ts"),
  `import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { create${pascal}Schema } from "@/lib/validators/${name}";

export async function GET() {
  try {
    const items = await prisma.${camel}.findMany({
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch";
    return apiError(msg, 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const parsed = await parseAndValidate(request, create${pascal}Schema);
  if ("error" in parsed) return parsed.error;

  try {
    const item = await prisma.${camel}.create({ data: parsed.data });
    return apiSuccess(item, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create";
    return apiError(msg, 500);
  }
}
`
);

write(
  join(apiDir, "[id]/route.ts"),
  `import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { update${pascal}Schema } from "@/lib/validators/${name}";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const item = await prisma.${camel}.findUnique({ where: { id } });
    if (!item) return apiError("Not found", 404);
    return apiSuccess(item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch";
    return apiError(msg, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const parsed = await parseAndValidate(request, update${pascal}Schema);
  if ("error" in parsed) return parsed.error;

  try {
    const item = await prisma.${camel}.update({
      where: { id },
      data: parsed.data,
    });
    return apiSuccess(item);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update";
    return apiError(msg, 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return apiError("Unauthorized", 401);

  const { id } = await params;
  try {
    await prisma.${camel}.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    return apiError(msg, 500);
  }
}
`
);

// ─── Validators ────────────────────────────────────────────────────

write(
  join(root, "src/lib/validators", `${name}.ts`),
  `import { z } from "zod";

export const create${pascal}Schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
});

export const update${pascal}Schema = create${pascal}Schema.partial();

export type Create${pascal}Input = z.infer<typeof create${pascal}Schema>;
export type Update${pascal}Input = z.infer<typeof update${pascal}Schema>;
`
);

// ─── Chat Provider ─────────────────────────────────────────────────

write(
  join(root, "src/lib/chat/providers", `${name}.provider.ts`),
  `import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

export class ${pascal}Provider implements DataProvider {
  domain = "foundation";
  types = ["${name}"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const items = await prisma.${camel}.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      id: \`${name}:\${item.id}\`,
      type: "${name}",
      domain: this.domain,
      name: item.name,
      description: null,
      contentLength: 200,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.${name}) return [];
    const items = await prisma.${camel}.findMany({
      where: { id: { in: grouped.${name} } },
    });
    return items.map((item) => ({
      id: \`${name}:\${item.id}\`,
      type: "${name}",
      name: item.name,
      content: truncate(\`# \${item.name}\`),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("${name}")) return [];
    const items = await prisma.${camel}.findMany({
      where: {
        OR: [{ name: { contains: keyword, mode: "insensitive" } }],
      },
      take,
    });
    return items.map((item) => ({
      id: \`${name}:\${item.id}\`,
      type: "${name}",
      name: item.name,
      content: truncate(\`# \${item.name}\`),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const items = await prisma.${camel}.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return items.map((item) => ({
      id: \`${name}:\${item.id}\`,
      type: "${name}",
      name: item.name,
      meta: {},
    }));
  }
}
`
);

// ─── Block Manifest ────────────────────────────────────────────────

write(
  join(root, "src/lib/blocks/blocks", `${name}.block.ts`),
  `import type { BlockManifest } from "../manifest";

export const ${camel}Block: BlockManifest = {
  name: "${name}",
  displayName: "${display}",
  description: "${display} management for HERD OS.",
  domain: "foundation",
  types: ["${name}"],
  capabilities: ["read", "create", "update", "delete"],
  models: ["${pascal}"],
  dependencies: [],
  paths: {
    components: "src/components/${name}/",
    pages: "src/app/admin/blocks/${name}/",
    api: "src/app/api/${name}/",
    validators: "src/lib/validators/${name}.ts",
    provider: "src/lib/chat/providers/${name}.provider.ts",
  },
  actions: [
    {
      name: "list_${name}",
      description: "List all ${display.toLowerCase()} items",
      method: "GET",
      endpoint: "/api/${name}",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of ${name} objects",
    },
    {
      name: "create_${name}",
      description: "Create a new ${display.toLowerCase()} item",
      method: "POST",
      endpoint: "/api/${name}",
      parametersSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] },
        },
        required: ["name"],
      },
      requiredFields: ["name"],
      responseDescription: "Created ${name} object",
    },
    {
      name: "update_${name}",
      description: "Update an existing ${display.toLowerCase()} item by ID",
      method: "PATCH",
      endpoint: "/api/${name}/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "${pascal} UUID" },
          name: { type: "string" },
          description: { type: "string" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated ${name} object",
    },
    {
      name: "delete_${name}",
      description: "Delete a ${display.toLowerCase()} item by ID. Confirm with user first.",
      method: "DELETE",
      endpoint: "/api/${name}/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "${pascal} UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Confirmation of deletion",
    },
  ],
};
`
);

// ─── Agent Definition ──────────────────────────────────────────────

const agentDir = join(root, ".agents/blocks", name);
ensure(agentDir);

write(
  join(agentDir, "AGENT.md"),
  `---
name: ${name}
description: Sub-agent for the ${display} block in HERD OS
version: "1.0.0"
domain: ${name}
capabilities: [read, create, update, delete]
models: [${pascal}]
types: [${name}]
---

# ${display} Sub-Agent

You are the **${display}** specialist agent for HERD OS.

## Domain Knowledge

The ${display} block manages ${display.toLowerCase()} within the HERD subscription operations platform.

## Owned Files

### Components
- \`src/components/${name}/\`

### Pages
- \`src/app/admin/blocks/${name}/page.tsx\`
- \`src/app/admin/blocks/${name}/[id]/page.tsx\`

### API Routes
- \`src/app/api/${name}/route.ts\` — GET (list) + POST (create)
- \`src/app/api/${name}/[id]/route.ts\` — GET + PATCH + DELETE

### Library Code
- \`src/lib/validators/${name}.ts\` — Zod schemas
- \`src/lib/chat/providers/${name}.provider.ts\` — DataProvider

### Block Manifest
- \`src/lib/blocks/blocks/${name}.block.ts\`

## Actions (Orchestrator Integration)

### \`list_${name}\` — List all items
### \`create_${name}\` — Required: name
### \`update_${name}\` — Required: id
### \`delete_${name}\` — Required: id. Confirm first

## Conventions

- All API responses use \`apiSuccess(data)\` / \`apiError(message, status)\`
- All mutations use \`parseAndValidate(request, schema)\`
- Dates serialized to ISO strings before sending to client
`
);

// ─── Summary ───────────────────────────────────────────────────────

console.log(`
Done! Next steps:
  1. Add the Prisma model for ${pascal} to prisma/schema.prisma
  2. Import and register the block manifest in src/lib/blocks/registry.ts
  3. Import and register the DataProvider in src/lib/chat/data-retrieval.ts
  4. Run: npx prisma db push
  5. Customize the generated files for your specific block needs
`);
