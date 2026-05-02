import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, relative, dirname, basename, sep } from "node:path";
import { parse } from "yaml";
import fastGlob from "fast-glob";
import { FeatureYmlSchema } from "../schemas/feature.zod";

const FIXED_LAYERS = new Set([
  "networks",
  "solutions",
  "tools",
  "blocks",
  "integrations",
]);

const FEATURE_LEVELS = new Set([
  "network",
  "solution",
  "tool",
  "block",
  "integration",
]);

async function main() {
  const root = resolve(__dirname, "..");
  const handbookRoot = resolve(root, "docs/handbook");
  const errors: string[] = [];
  let count = 0;

  const files = await fastGlob("**/feature.yml", { cwd: handbookRoot, absolute: true });

  for (const file of files) {
    count++;
    const raw = readFileSync(file, "utf-8");
    let parsed: unknown;
    try {
      parsed = parse(raw);
    } catch (err) {
      errors.push(`${relative(root, file)}: YAML parse error — ${(err as Error).message}`);
      continue;
    }

    const result = FeatureYmlSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${relative(root, file)}: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }

    const data = result.data;
    const dir = dirname(file);
    const rel = relative(handbookRoot, dir);
    const segments = rel.split(sep);

    // Layout rules:
    //   layer:    {layer}/(overview)              — 2 segments, last == "(overview)"
    //   category: {layer}/{category}/(overview)   — 3 segments, last == "(overview)"
    //   feature:  {layer}/{category}/{id}         — 3 segments, all kebab
    //   meta:     _meta/{id}                      — 2 segments, first == "_meta"

    const lvl = data.level;
    const fileRel = relative(root, file);

    if (lvl === "layer") {
      if (segments.length !== 2 || segments[1] !== "(overview)") {
        errors.push(`${fileRel}: level=layer expects path {layer}/(overview)/, got ${rel}`);
        continue;
      }
      const layerName = segments[0];
      if (!FIXED_LAYERS.has(layerName)) {
        errors.push(`${fileRel}: layer "${layerName}" not in fixed set [${[...FIXED_LAYERS].join(", ")}]`);
      }
      if (data.id !== layerName) {
        errors.push(`${fileRel}: id="${data.id}" but layer dir is "${layerName}"`);
      }
      const expectedUid = `herd.layer.${layerName}`;
      if (data.uid !== expectedUid) {
        errors.push(`${fileRel}: uid="${data.uid}" but should be "${expectedUid}"`);
      }
      if (data.parent != null) {
        errors.push(`${fileRel}: layers must have parent: null`);
      }
    } else if (lvl === "category") {
      if (segments.length !== 3 || segments[2] !== "(overview)") {
        errors.push(`${fileRel}: level=category expects path {layer}/{category}/(overview)/, got ${rel}`);
        continue;
      }
      const layerName = segments[0];
      const catId = segments[1];
      if (!FIXED_LAYERS.has(layerName)) {
        errors.push(`${fileRel}: layer "${layerName}" not in fixed set`);
      }
      if (data.id !== catId) {
        errors.push(`${fileRel}: id="${data.id}" but category dir is "${catId}"`);
      }
      const expectedUid = `herd.category.${layerName}.${catId}`;
      if (data.uid !== expectedUid) {
        errors.push(`${fileRel}: uid="${data.uid}" but should be "${expectedUid}"`);
      }
      const expectedParent = `herd.layer.${layerName}`;
      if (data.parent !== expectedParent) {
        errors.push(`${fileRel}: parent="${data.parent}" but should be "${expectedParent}"`);
      }
    } else if (FEATURE_LEVELS.has(lvl)) {
      if (segments.length !== 3) {
        errors.push(`${fileRel}: level=${lvl} expects path {layer}/{category}/{id}/, got ${rel}`);
        continue;
      }
      const layerName = segments[0];
      const catId = segments[1];
      const featId = segments[2];
      if (featId === "(overview)") {
        errors.push(`${fileRel}: feature dir cannot be "(overview)" — that's reserved for category overview`);
        continue;
      }
      if (!FIXED_LAYERS.has(layerName)) {
        errors.push(`${fileRel}: layer "${layerName}" not in fixed set`);
      }
      if (data.id !== featId) {
        errors.push(`${fileRel}: id="${data.id}" but feature dir is "${featId}"`);
      }
      const expectedUid = `herd.${lvl}.${catId}.${featId}`;
      if (data.uid !== expectedUid) {
        errors.push(`${fileRel}: uid="${data.uid}" but should be "${expectedUid}"`);
      }
      const expectedParent = `herd.category.${layerName}.${catId}`;
      if (data.parent !== expectedParent) {
        errors.push(`${fileRel}: parent="${data.parent}" but should be "${expectedParent}"`);
      }
    } else if (lvl === "meta") {
      if (segments.length !== 2 || segments[0] !== "_meta") {
        errors.push(`${fileRel}: level=meta expects path _meta/{id}/, got ${rel}`);
        continue;
      }
      const id = segments[1];
      if (data.id !== id) {
        errors.push(`${fileRel}: id="${data.id}" but meta dir is "${id}"`);
      }
      const expectedUid = `herd.meta.${id}`;
      if (data.uid !== expectedUid) {
        errors.push(`${fileRel}: uid="${data.uid}" but should be "${expectedUid}"`);
      }
      if (data.parent != null) {
        errors.push(`${fileRel}: meta entries must have parent: null`);
      }
    } else {
      errors.push(`${fileRel}: unhandled level "${lvl}"`);
    }

    void basename;
  }

  if (errors.length > 0) {
    console.error(`✗ ${errors.length} error(s) across ${count} file(s):`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ ${count} feature.yml file(s) validated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
