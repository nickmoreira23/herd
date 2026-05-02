import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import fastGlob from "fast-glob";

async function main() {
  const root = resolve(__dirname, "..");
  const handbookRoot = resolve(root, "docs/handbook");
  const skillsRoot = resolve(root, ".agents/skills");
  const outPath = resolve(root, "mcp/generated/manifest.json");

  mkdirSync(dirname(outPath), { recursive: true });

  const featureFiles = await fastGlob("**/feature.yml", {
    cwd: handbookRoot,
    absolute: true,
  });
  const skillFiles = await fastGlob("**/SKILL.md", {
    cwd: skillsRoot,
    absolute: true,
  });

  const sourceContent: string[] = [];
  for (const f of [...featureFiles, ...skillFiles].sort()) {
    sourceContent.push(readFileSync(f, "utf-8"));
  }
  const sourceHash =
    "sha256:" + createHash("sha256").update(sourceContent.join("\n")).digest("hex");

  const manifest = {
    name: "herd-docs-mcp",
    version: "0.1.0",
    description: "Read-only access to HERD's Handbook, SKILLs, and feature graph.",
    tools: [
      {
        name: "search",
        annotations: {
          title: "Search HERD Handbook",
          readOnlyHint: true,
          idempotentHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      {
        name: "fetch",
        annotations: {
          title: "Fetch HERD Handbook entry",
          readOnlyHint: true,
          idempotentHint: true,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
    ],
    resources: [],
    feature_count: featureFiles.length,
    skill_count: skillFiles.length,
    generated_at: new Date().toISOString().slice(0, 10),
    source_files_hash: sourceHash,
  };

  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(
    `✓ mcp/generated/manifest.json (${featureFiles.length} features, ${skillFiles.length} skills)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
