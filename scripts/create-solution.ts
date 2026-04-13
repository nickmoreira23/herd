/**
 * Solution Generator Script
 *
 * Scaffolds all required files for a new HERD solution following the standard architecture.
 *
 * Usage:
 *   npx tsx scripts/create-solution.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"
 *
 * Creates:
 *   - src/lib/solutions/solutions/{name}.solution.ts
 *   - src/app/admin/solutions/{name}/[tool]/page.tsx (coming-soon page)
 *   - .agents/solutions/{name}/AGENT.md
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
    'Usage: npx tsx scripts/create-solution.ts --name "hr" --display "Human Resources" --tools "recruiting,onboarding,performance"'
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

console.log(`\nScaffolding solution: ${display} (${name})\n`);

// ─── Solution Manifest ────────────────────────────────────────────

const manifestDir = join(root, "src/lib/solutions/solutions");
ensure(manifestDir);

const toolEntries = tools
  .map(
    (t, i) => `    {
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
        page: "src/app/admin/solutions/${name}/${t}/",
      },
    }`
  )
  .join(",\n");

write(
  join(manifestDir, `${name}.solution.ts`),
  `import type { SolutionManifest } from "../manifest";

export const ${name}Solution: SolutionManifest = {
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

// ─── Solution Page (coming-soon) ──────────────────────────────────

const pageDir = join(root, "src/app/admin/solutions", name, "[tool]");
ensure(pageDir);

write(
  join(pageDir, "page.tsx"),
  `import { notFound } from "next/navigation";
import { solutionRegistry } from "@/lib/solutions/registry";
import { SolutionLanding } from "@/components/solutions/solution-landing";

export default async function ${capitalize(name)}ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const manifest = solutionRegistry.get("${name}");
  if (!manifest) notFound();

  const toolDef = manifest.tools.find((t) => t.name === tool);
  if (!toolDef) notFound();

  return <SolutionLanding manifest={manifest} />;
}
`
);

// ─── Agent Definition ─────────────────────────────────────────────

const agentDir = join(root, ".agents/solutions", name);
ensure(agentDir);

write(
  join(agentDir, "AGENT.md"),
  `---
name: ${name}
description: Sub-agent for the ${display} solution in HERD OS
version: "1.0.0"
domain: ${name}
tools: [${tools.join(", ")}]
blockDependencies: []
---

# ${display} Solution Agent

You are the **${display}** solution specialist for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The ${display} solution provides tools for managing ${tools.join(", ")} within HERD OS. All tools are currently in development (coming-soon status).

## Tools

${tools.map((t) => `### ${capitalize(t)}\n- **Status:** coming-soon\n- **Description:** ${capitalize(t)} tool for ${display}\n`).join("\n")}

## Owned Files

### Solution Manifest
- \`src/lib/solutions/solutions/${name}.solution.ts\`

### Pages
- \`src/app/admin/solutions/${name}/[tool]/page.tsx\`

## Conventions

- Solutions compose blocks — they don't own data models directly
- Tool pages reuse existing block components and API routes where possible
- Solution manifests declare block dependencies for validation and discovery
- Navigation is data-driven from the solution registry
`
);

// ─── Summary ──────────────────────────────────────────────────────

console.log(`
Done! Next steps:
  1. Import and register the solution in src/lib/solutions/registry.ts:
     import { ${name}Solution } from "./solutions/${name}.solution";
     Add to the solutions array.
  2. Add icon mapping in src/lib/solutions/solution-meta.ts
  3. Customize tool definitions (blocks, actions, status) in the manifest
  4. Build tool-specific pages as tools become active
`);
