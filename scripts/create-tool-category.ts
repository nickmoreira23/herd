/**
 * Tool Category Generator Script
 *
 * Scaffolds all required files for a new HERD tool category following the
 * standard architecture.
 *
 * Usage:
 *   npx tsx scripts/create-tool-category.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"
 *
 * Creates:
 *   - src/lib/tools/categories/{name}.category.ts
 *   - src/app/admin/tools/{name}/[tool]/page.tsx (coming-soon page)
 *   - .agents/tools/{name}/AGENT.md
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
const toolsArg = getArg("--tools");

if (!name || !display || !toolsArg) {
  console.error(
    'Usage: npx tsx scripts/create-tool-category.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"'
  );
  process.exit(1);
}

const tools = toolsArg.split(",").map((t) => t.trim());
const root = join(__dirname, "..");

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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

console.log(`\nScaffolding tool category: ${display} (${name})\n`);

// ─── Category Manifest ────────────────────────────────────────────

const manifestDir = join(root, "src/lib/tools/categories");
ensure(manifestDir);

const toolEntries = tools
  .map(
    (t) => `    {
      name: "${t}",
      displayName: "${capitalize(t)}",
      description: "${capitalize(t)} tool for ${display}.",
      icon: "Wrench",
      color: "#6b7280",
      status: "coming-soon",
      hasSubRoutes: false,
      blocks: [],
      actions: [],
      paths: {
        page: "src/app/admin/tools/${name}/${t}/",
      },
    }`
  )
  .join(",\n");

write(
  join(manifestDir, `${name}.category.ts`),
  `import type { ToolCategoryManifest } from "../manifest";

export const ${name}Category: ToolCategoryManifest = {
  name: "${name}",
  displayName: "${display}",
  description: "${display} tools for HERD OS.",
  icon: "Wrench",
  color: "#6b7280",
  domain: "${name}",
  sortOrder: 50,
  capabilities: [
${tools.map((t) => `    "Manage ${t}"`).join(",\n")},
  ],
  tools: [
${toolEntries},
  ],
};
`
);

// ─── Category Tool Page (coming-soon) ─────────────────────────────

const pageDir = join(root, "src/app/admin/tools", name, "[tool]");
ensure(pageDir);

write(
  join(pageDir, "page.tsx"),
  `import { notFound } from "next/navigation";
import { toolCategoryRegistry } from "@/lib/tools/registry";
import { CategoryLanding } from "@/components/tools/category-landing";

export default async function ${capitalize(name)}ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const manifest = toolCategoryRegistry.get("${name}");
  if (!manifest) notFound();

  const toolDef = manifest.tools.find((t) => t.name === tool);
  if (!toolDef) notFound();

  return <CategoryLanding manifest={manifest} />;
}
`
);

// ─── Agent Definition ─────────────────────────────────────────────

const agentDir = join(root, ".agents/tools", name);
ensure(agentDir);

write(
  join(agentDir, "AGENT.md"),
  `---
name: ${name}
description: Sub-agent for the ${display} tool category in HERD OS
version: "1.0.0"
domain: ${name}
tools: [${tools.join(", ")}]
blockDependencies: []
---

# ${display} Tools Agent

You are the **${display}** tools specialist for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The ${display} category provides tools for managing ${tools.join(", ")} within HERD OS. All tools are currently in development (coming-soon status).

## Tools

${tools.map((t) => `### ${capitalize(t)}\n- **Status:** coming-soon\n- **Description:** ${capitalize(t)} tool for ${display}\n`).join("\n")}

## Owned Files

### Category Manifest
- \`src/lib/tools/categories/${name}.category.ts\`

### Pages
- \`src/app/admin/tools/${name}/[tool]/page.tsx\`

## Conventions

- Tools compose blocks — they don't own data models directly
- Tool pages reuse existing block components and API routes where possible
- Category manifests declare block dependencies for validation and discovery
- Navigation is data-driven from the tool registry
`
);

// ─── Summary ──────────────────────────────────────────────────────

console.log(`
Done! Next steps:
  1. Import and register the category in src/lib/tools/registry.ts:
     import { ${name}Category } from "./categories/${name}.category";
     Add to the categories array.
  2. Add icon mapping in src/lib/tools/category-meta.ts
  3. Customize tool definitions (blocks, actions, status) in the manifest
  4. Build tool-specific pages as tools become active
`);
