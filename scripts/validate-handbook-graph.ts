import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import fastGlob from "fast-glob";
import { FeatureYmlSchema, type FeatureYml } from "../schemas/feature.zod";

async function main() {
  const root = resolve(__dirname, "..");
  const handbookRoot = resolve(root, "docs/handbook");
  const allowlistPath = resolve(handbookRoot, "_meta/.legacy-allowlist.txt");

  const allowlist = new Set<string>();
  if (existsSync(allowlistPath)) {
    for (const line of readFileSync(allowlistPath, "utf-8").split("\n")) {
      const t = line.trim();
      if (t && !t.startsWith("#")) allowlist.add(t);
    }
  }

  const files = await fastGlob("**/feature.yml", { cwd: handbookRoot, absolute: true });
  // Map by UID — cross-references are full UIDs across the new hierarchy.
  const features = new Map<string, FeatureYml>();
  for (const file of files) {
    const data = FeatureYmlSchema.parse(parse(readFileSync(file, "utf-8")));
    features.set(data.uid, data);
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [uid, feature] of features) {
    // Hierarchical parent rules.
    const lvl = feature.level;
    if (lvl === "layer" || lvl === "meta") {
      if (feature.parent != null) {
        errors.push(`${uid}: level=${lvl} must have parent=null, got "${feature.parent}"`);
      }
    } else if (lvl === "category") {
      if (!feature.parent) {
        errors.push(`${uid}: level=category must declare parent`);
      } else {
        const p = features.get(feature.parent);
        if (!p) {
          errors.push(`${uid}.parent → ${feature.parent} (no such feature.yml)`);
        } else if (p.level !== "layer") {
          errors.push(`${uid}: parent must be a layer, got level=${p.level}`);
        }
      }
    } else {
      // feature levels: network, solution, tool, block, integration
      if (!feature.parent) {
        errors.push(`${uid}: level=${lvl} must declare parent`);
      } else {
        const p = features.get(feature.parent);
        if (!p) {
          errors.push(`${uid}.parent → ${feature.parent} (no such feature.yml)`);
        } else if (p.level !== "category") {
          errors.push(`${uid}: parent must be a category, got level=${p.level}`);
        }
      }
    }

    // Cross-reference resolution (children/consumes/consumed_by/related).
    const refs: Array<[string, string]> = [];
    for (const c of feature.children) refs.push(["children", c]);
    for (const c of feature.consumes) refs.push(["consumes", c]);
    for (const c of feature.consumed_by) refs.push(["consumed_by", c]);
    for (const r of feature.related) refs.push(["related", r]);

    for (const [field, ref] of refs) {
      if (!features.has(ref)) {
        const key = `${uid}:${field}:${ref}`;
        if (allowlist.has(key)) {
          warnings.push(`${uid}.${field} → ${ref} (allowlisted)`);
        } else {
          errors.push(`${uid}.${field} → ${ref} (no such feature.yml)`);
        }
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`⚠ ${warnings.length} allowlisted dangling ref(s):`);
    for (const w of warnings) console.warn("  - " + w);
  }
  if (errors.length > 0) {
    console.error(`✗ ${errors.length} graph error(s):`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }
  console.log(`✓ Cross-reference graph validated (${features.size} features)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
