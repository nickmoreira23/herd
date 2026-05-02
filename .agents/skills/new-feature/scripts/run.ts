import "dotenv/config";
import { input, select, confirm, checkbox } from "@inquirer/prompts";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { stringify } from "yaml";
import { execSync } from "node:child_process";
import {
  Level,
  TechnicalCategory,
  Perspective,
  FeatureYmlSchema,
} from "../../../../schemas/feature.zod";

async function main() {
  const root = resolve(__dirname, "../../../..");

  const level = (await select({
    message: "Level:",
    choices: Level.options.map((v) => ({ name: v, value: v })),
  })) as (typeof Level.options)[number];

  const id = await input({
    message: "Feature id (kebab-case):",
    validate: (v) => /^[a-z][a-z0-9-]*$/.test(v) || "kebab-case required",
  });

  const targetDir = resolve(root, "docs/handbook", level, id);
  if (existsSync(targetDir)) {
    console.error(`✗ ${targetDir} already exists. Choose a different id.`);
    process.exit(1);
  }

  const titleEnUS = await input({ message: "Title (en-US):" });
  const titlePtBR = await input({ message: "Title (pt-BR):" });
  const descEnUS = await input({
    message: "Description ≤280 chars (en-US):",
    validate: (v) => v.length > 0 && v.length <= 280 || "1-280 chars required",
  });
  const descPtBR = await input({
    message: "Description ≤280 chars (pt-BR):",
    validate: (v) => v.length > 0 && v.length <= 280 || "1-280 chars required",
  });

  const ownerDefault = (() => {
    try {
      const name = execSync("git config user.name").toString().trim();
      return "@" + name.toLowerCase().replace(/\s+/g, "");
    } catch {
      return "@nick";
    }
  })();
  const ownersRaw = await input({
    message: "Owners (comma-separated):",
    default: ownerDefault,
  });
  const owners = ownersRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);

  let parent: string | undefined;
  if (["solution", "tool", "integration"].includes(level)) {
    const p = await input({
      message: "Parent feature id (optional, press Enter to skip):",
    });
    parent = p || undefined;
  }

  const consumesRaw = await input({
    message: "Consumes (comma-separated feature ids, optional):",
  });
  const consumes = consumesRaw.split(",").map((s) => s.trim()).filter(Boolean);

  const wantsSkill = await confirm({
    message: "Generate SKILL.md?",
    default: ["block", "tool"].includes(level),
  });

  const defaultPerspectives = (() => {
    if (level === "integration") {
      return ["business", "architecture", "operations", "changelog"];
    }
    if (["block", "tool"].includes(level)) {
      return Perspective.options.slice();
    }
    return ["business", "product", "architecture"];
  })() as (typeof Perspective.options)[number][];

  const perspectives = (await checkbox({
    message: "Perspectives:",
    choices: Perspective.options.map((p) => ({
      name: p,
      value: p,
      checked: defaultPerspectives.includes(p),
    })),
  })) as (typeof Perspective.options)[number][];

  const technicalCategory:
    | (typeof TechnicalCategory.options)[number]
    | undefined = (() => {
    if (level === "block") return "block";
    if (level === "tool") return "tool";
    return undefined;
  })();

  const featureYml = {
    id,
    uid: `herd.${level}.${id}`,
    level,
    ...(technicalCategory ? { technical_category: technicalCategory } : {}),
    title: { "pt-BR": titlePtBR, "en-US": titleEnUS },
    description: { "pt-BR": descPtBR, "en-US": descEnUS },
    status: "draft" as const,
    owners,
    since: today,
    updated: today,
    ...(parent ? { parent } : {}),
    children: [],
    consumes,
    consumed_by: [],
    related: [],
    source_paths: [],
    artifacts: { handbook: true, skill: wantsSkill, mcp: false },
    perspectives,
  };

  const validated = FeatureYmlSchema.safeParse(featureYml);
  if (!validated.success) {
    console.error("✗ Schema validation failed:");
    for (const issue of validated.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(resolve(targetDir, "feature.yml"), stringify(featureYml), "utf-8");

  const stubBody = (locale: "pt-BR" | "en-US") => {
    const t = locale === "pt-BR" ? titlePtBR : titleEnUS;
    const d = locale === "pt-BR" ? descPtBR : descEnUS;
    const agentNote = locale === "pt-BR"
      ? "**Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML."
      : "**For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.";

    const perspectiveBodies = perspectives.map((p) => {
      const heading = p[0].toUpperCase() + p.slice(1);
      return `## ${heading}\n\n<!-- TODO: ${heading} perspective for ${id} (${locale}). -->\n`;
    }).join("\n");

    return `---
title: ${t}
description: ${d}
locale: ${locale}
uid: herd.${level}.${id}
---

> ${agentNote}

# ${t}

<!-- TODO: 2-3 sentence executive summary (${locale}). -->

${perspectiveBodies}`;
  };

  writeFileSync(resolve(targetDir, "pt-BR.md"), stubBody("pt-BR"), "utf-8");
  writeFileSync(resolve(targetDir, "en-US.md"), stubBody("en-US"), "utf-8");

  if (wantsSkill) {
    const skillDir = resolve(root, ".agents/skills", `feature-${level}-${id}`);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      resolve(skillDir, "SKILL.md"),
      `---
name: feature-${level}-${id}
description: Working with the ${titleEnUS} ${level} in HERD. Use this skill whenever the user mentions ${id}, modifies code in source paths listed in feature.yml, or asks operational questions about this feature. Do NOT use for unrelated work.
license: Apache-2.0
metadata:
  herd:
    feature_uid: herd.${level}.${id}
    level: ${level}
    handbook_path: docs/handbook/${level}/${id}/
    version: "1.0"
    classification: feature-bound
---

# ${titleEnUS}

<!-- TODO: When to use this skill (specific triggers, exclusions). -->

## Architecture summary

<!-- TODO: 3-5 paragraphs lifted from the en-US Architecture perspective. -->

## Conventions

<!-- TODO: Project conventions specific to this feature. -->

## Common tasks

<!-- TODO: List of common workflows. -->

## Invariants

<!-- TODO: Things that must always be true about this feature. -->

## See also

- Handbook: docs/handbook/${level}/${id}/en-US.md
- feature.yml: docs/handbook/${level}/${id}/feature.yml
`,
      "utf-8",
    );
  }

  console.log(`\n✓ Scaffolded ${level}/${id}`);
  console.log("\nNext steps:");
  console.log(`  1. Edit docs/handbook/${level}/${id}/{pt-BR,en-US}.md`);
  if (wantsSkill) {
    console.log(`  2. Edit .agents/skills/feature-${level}-${id}/SKILL.md`);
  }
  console.log("  3. Run: npm run validate:handbook");
  console.log("  4. Run: npm run gen:all");
  console.log("  5. Stage and commit when ready.\n");
}

main().catch((err) => {
  if (err?.name === "ExitPromptError") {
    console.log("\nAborted.");
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});
