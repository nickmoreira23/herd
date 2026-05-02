import "dotenv/config";
import { input, select, confirm } from "@inquirer/prompts";
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { stringify as yamlStringify } from "yaml";
import { FeatureYmlSchema } from "../../../../schemas/feature.zod";

const HANDBOOK_ROOT = join(process.cwd(), "docs/handbook");

const LAYERS = ["networks", "solutions", "tools", "blocks", "integrations"] as const;
type Layer = (typeof LAYERS)[number];

const FEATURE_LEVEL_FOR_LAYER: Record<Layer, string> = {
  networks: "network",
  solutions: "solution",
  tools: "tool",
  blocks: "block",
  integrations: "integration",
};

const TECHNICAL_CATEGORY_FOR_LEVEL: Record<string, "block" | "tool" | "foundation" | undefined> = {
  block: "block",
  tool: "tool",
  // network/solution/integration: no technical_category set by default
};

interface OverviewInput {
  titlePtBr: string;
  titleEnUs: string;
  descriptionPtBr: string;
  descriptionEnUs: string;
}

interface FeatureInput extends OverviewInput {
  owners: string[];
  consumes: string[];
}

async function main() {
  console.log("Handbook scaffolder v2.0");
  console.log("========================\n");

  const type = await select<"feature" | "category" | "meta">({
    message: "What type of entry?",
    choices: [
      {
        name: "Feature individual (network / solution / tool / block / integration)",
        value: "feature",
      },
      {
        name: "Category overview (e.g., 'Marketing Tools', 'Healthcare Solutions')",
        value: "category",
      },
      { name: "Meta entry (system documentation)", value: "meta" },
    ],
  });

  if (type === "meta") return scaffoldMeta();
  if (type === "category") return scaffoldCategory();
  return scaffoldFeature();
}

async function scaffoldFeature() {
  const layer = await select<Layer>({
    message: "Which layer?",
    choices: LAYERS.map((l) => ({ name: l, value: l })),
  });

  const layerDir = join(HANDBOOK_ROOT, layer);
  const existingCategories = existsSync(layerDir)
    ? readdirSync(layerDir).filter(
        (name) =>
          name !== "(overview)" &&
          existsSync(join(layerDir, name, "(overview)")),
      )
    : [];

  const categoryChoices = [
    ...existingCategories.map((c) => ({ name: c, value: c })),
    { name: "+ Create new category", value: "__new__" },
  ];

  let category = await select<string>({
    message: "Which category?",
    choices: categoryChoices,
  });

  if (category === "__new__") {
    const newCat = await input({
      message: "New category id (kebab-case, e.g., 'marketing'):",
      validate: (v) =>
        /^[a-z][a-z0-9-]*$/.test(v) || "Must be kebab-case",
    });

    const createOverview = await confirm({
      message: `Category '${newCat}' doesn't exist yet. Create overview now?`,
      default: true,
    });

    if (createOverview) {
      const titlePtBr = await input({ message: "Category title (pt-BR):" });
      const titleEnUs = await input({ message: "Category title (en-US):" });
      const descPtBr = await input({
        message: "Category description (pt-BR, ≤280 chars):",
        validate: (v) =>
          (v.length > 0 && v.length <= 280) || "1-280 chars required",
      });
      const descEnUs = await input({
        message: "Category description (en-US, ≤280 chars):",
        validate: (v) =>
          (v.length > 0 && v.length <= 280) || "1-280 chars required",
      });
      writeCategoryOverview(layer, newCat, {
        titlePtBr,
        titleEnUs,
        descriptionPtBr: descPtBr,
        descriptionEnUs: descEnUs,
      });
      console.log(`✓ Created category overview at ${layer}/${newCat}/(overview)/`);
    }

    category = newCat;
  }

  const id = await input({
    message: "Feature id (kebab-case):",
    validate: (v) =>
      /^[a-z][a-z0-9-]*$/.test(v) || "Must be kebab-case",
  });

  const featureDir = join(HANDBOOK_ROOT, layer, category, id);
  if (existsSync(featureDir)) {
    console.error(`✗ ${featureDir} already exists. Choose a different id.`);
    process.exit(1);
  }

  const titlePtBr = await input({ message: "Title (pt-BR):" });
  const titleEnUs = await input({ message: "Title (en-US):" });
  const descPtBr = await input({
    message: "Description (pt-BR, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });
  const descEnUs = await input({
    message: "Description (en-US, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });
  const ownersStr = await input({
    message: "Owners (comma-separated GitHub handles):",
    default: "@nick",
  });
  const consumesStr = await input({
    message: "Consumes (comma-separated full UIDs, optional):",
    default: "",
  });

  const owners = ownersStr.split(",").map((s) => s.trim()).filter(Boolean);
  const consumes = consumesStr.split(",").map((s) => s.trim()).filter(Boolean);

  writeFeature(layer, category, id, {
    titlePtBr,
    titleEnUs,
    descriptionPtBr: descPtBr,
    descriptionEnUs: descEnUs,
    owners,
    consumes,
  });

  console.log("");
  console.log(`✓ Created feature at ${layer}/${category}/${id}/`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Review the generated files.");
  console.log("  2. Fill in TODOs in the .md files.");
  console.log("  3. Run: npm run gen:all");
  console.log("  4. Run: npm run validate:handbook");
}

async function scaffoldCategory() {
  const layer = await select<Layer>({
    message: "Which layer?",
    choices: LAYERS.map((l) => ({ name: l, value: l })),
  });

  const id = await input({
    message: "Category id (kebab-case):",
    validate: (v) =>
      /^[a-z][a-z0-9-]*$/.test(v) || "Must be kebab-case",
  });

  const targetDir = join(HANDBOOK_ROOT, layer, id, "(overview)");
  if (existsSync(targetDir)) {
    console.error(`✗ ${targetDir} already exists.`);
    process.exit(1);
  }

  const titlePtBr = await input({ message: "Title (pt-BR):" });
  const titleEnUs = await input({ message: "Title (en-US):" });
  const descPtBr = await input({
    message: "Description (pt-BR, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });
  const descEnUs = await input({
    message: "Description (en-US, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });

  writeCategoryOverview(layer, id, {
    titlePtBr,
    titleEnUs,
    descriptionPtBr: descPtBr,
    descriptionEnUs: descEnUs,
  });

  console.log("");
  console.log(`✓ Created category overview at ${layer}/${id}/(overview)/`);
  console.log("\nNext: npm run gen:all && npm run validate:handbook");
}

async function scaffoldMeta() {
  const id = await input({
    message: "Meta entry id (kebab-case):",
    validate: (v) =>
      /^[a-z][a-z0-9-]*$/.test(v) || "Must be kebab-case",
  });

  const targetDir = join(HANDBOOK_ROOT, "_meta", id);
  if (existsSync(targetDir)) {
    console.error(`✗ ${targetDir} already exists.`);
    process.exit(1);
  }

  const titlePtBr = await input({ message: "Title (pt-BR):" });
  const titleEnUs = await input({ message: "Title (en-US):" });
  const descPtBr = await input({
    message: "Description (pt-BR, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });
  const descEnUs = await input({
    message: "Description (en-US, ≤280 chars):",
    validate: (v) =>
      (v.length > 0 && v.length <= 280) || "1-280 chars required",
  });

  writeMeta(id, {
    titlePtBr,
    titleEnUs,
    descriptionPtBr: descPtBr,
    descriptionEnUs: descEnUs,
  });

  console.log("");
  console.log(`✓ Created meta entry at _meta/${id}/`);
  console.log("\nNext: npm run gen:all && npm run validate:handbook");
}

export function writeFeature(
  layer: Layer,
  category: string,
  id: string,
  data: FeatureInput,
) {
  const dir = join(HANDBOOK_ROOT, layer, category, id);
  mkdirSync(dir, { recursive: true });

  const level = FEATURE_LEVEL_FOR_LAYER[layer];
  const uid = `herd.${level}.${category}.${id}`;
  const parent = `herd.category.${layer}.${category}`;
  const today = new Date().toISOString().slice(0, 10);
  const technical = TECHNICAL_CATEGORY_FOR_LEVEL[level];

  const featureYml: Record<string, unknown> = {
    id,
    uid,
    level,
    ...(technical ? { technical_category: technical } : {}),
    title: { "pt-BR": data.titlePtBr, "en-US": data.titleEnUs },
    description: { "pt-BR": data.descriptionPtBr, "en-US": data.descriptionEnUs },
    status: "draft",
    owners: data.owners,
    since: today,
    updated: today,
    parent,
    children: [],
    consumes: data.consumes,
    consumed_by: [],
    related: [],
    source_paths: [],
    artifacts: { handbook: true, skill: false, mcp: false },
    perspectives: ["business", "product", "architecture", "operations", "glossary", "changelog"],
  };

  // Validate against schema before writing
  const result = FeatureYmlSchema.safeParse(featureYml);
  if (!result.success) {
    console.error("✗ Generated feature.yml fails schema validation:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  writeFileSync(join(dir, "feature.yml"), yamlStringify(featureYml), "utf-8");
  writeFileSync(
    join(dir, "en-US.md"),
    buildMarkdown("en-US", uid, data.titleEnUs, data.descriptionEnUs),
    "utf-8",
  );
  writeFileSync(
    join(dir, "pt-BR.md"),
    buildMarkdown("pt-BR", uid, data.titlePtBr, data.descriptionPtBr),
    "utf-8",
  );
}

export function writeCategoryOverview(
  layer: Layer,
  category: string,
  data: OverviewInput,
) {
  const dir = join(HANDBOOK_ROOT, layer, category, "(overview)");
  mkdirSync(dir, { recursive: true });

  const uid = `herd.category.${layer}.${category}`;
  const parent = `herd.layer.${layer}`;
  const today = new Date().toISOString().slice(0, 10);

  const featureYml: Record<string, unknown> = {
    id: category,
    uid,
    level: "category",
    technical_category: "foundation",
    title: { "pt-BR": data.titlePtBr, "en-US": data.titleEnUs },
    description: { "pt-BR": data.descriptionPtBr, "en-US": data.descriptionEnUs },
    status: "active",
    owners: ["@nick"],
    since: today,
    updated: today,
    parent,
    children: [],
    consumes: [],
    consumed_by: [],
    related: [],
    artifacts: { handbook: true, skill: false, mcp: false },
    perspectives: ["business", "product", "architecture", "operations", "glossary", "changelog"],
  };

  const result = FeatureYmlSchema.safeParse(featureYml);
  if (!result.success) {
    console.error("✗ Generated feature.yml fails schema validation:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  writeFileSync(join(dir, "feature.yml"), yamlStringify(featureYml), "utf-8");
  writeFileSync(
    join(dir, "en-US.md"),
    buildMarkdown("en-US", uid, data.titleEnUs, data.descriptionEnUs),
    "utf-8",
  );
  writeFileSync(
    join(dir, "pt-BR.md"),
    buildMarkdown("pt-BR", uid, data.titlePtBr, data.descriptionPtBr),
    "utf-8",
  );
}

export function writeMeta(id: string, data: OverviewInput) {
  const dir = join(HANDBOOK_ROOT, "_meta", id);
  mkdirSync(dir, { recursive: true });

  const uid = `herd.meta.${id}`;
  const today = new Date().toISOString().slice(0, 10);

  const featureYml: Record<string, unknown> = {
    id,
    uid,
    level: "meta",
    technical_category: "foundation",
    title: { "pt-BR": data.titlePtBr, "en-US": data.titleEnUs },
    description: { "pt-BR": data.descriptionPtBr, "en-US": data.descriptionEnUs },
    status: "active",
    owners: ["@nick"],
    since: today,
    updated: today,
    parent: null,
    children: [],
    consumes: [],
    consumed_by: [],
    related: [],
    artifacts: { handbook: true, skill: false, mcp: false },
    perspectives: ["business", "product", "architecture", "operations", "glossary", "changelog"],
  };

  const result = FeatureYmlSchema.safeParse(featureYml);
  if (!result.success) {
    console.error("✗ Generated feature.yml fails schema validation:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  writeFileSync(join(dir, "feature.yml"), yamlStringify(featureYml), "utf-8");
  writeFileSync(
    join(dir, "en-US.md"),
    buildMarkdown("en-US", uid, data.titleEnUs, data.descriptionEnUs),
    "utf-8",
  );
  writeFileSync(
    join(dir, "pt-BR.md"),
    buildMarkdown("pt-BR", uid, data.titlePtBr, data.descriptionPtBr),
    "utf-8",
  );
}

function buildMarkdown(
  locale: "pt-BR" | "en-US",
  uid: string,
  title: string,
  description: string,
): string {
  const isPtBr = locale === "pt-BR";
  const today = new Date().toISOString().slice(0, 10);
  const agentNote = isPtBr
    ? "**Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML."
    : "**For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.";
  const initialPub = isPtBr ? "Publicação inicial." : "Initial publication.";

  return `---
title: ${title}
description: ${description}
locale: ${locale}
uid: ${uid}
---

> ${agentNote}

# ${title}

${description}

## Business

<!-- TODO: Business perspective. -->

## Product

<!-- TODO: Product perspective. -->

## Architecture

<!-- TODO: Architecture perspective. -->

## Operations

<!-- TODO: Operations perspective. -->

## Glossary

<!-- TODO: Local glossary. -->

## Changelog

- **${today}** — ${initialPub}
`;
}

// Only run main when invoked as a script (not when imported for smoke testing)
if (require.main === module) {
  main().catch((e) => {
    if (e?.name === "ExitPromptError") {
      console.log("\nAborted.");
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  });
}
