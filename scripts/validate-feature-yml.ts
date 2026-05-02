import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve, relative, dirname, basename } from "node:path";
import { parse } from "yaml";
import fastGlob from "fast-glob";
import { FeatureYmlSchema } from "../schemas/feature.zod";

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
    const expectedId = basename(dir);
    const expectedLevel = basename(dirname(dir));

    if (data.id !== expectedId) {
      errors.push(`${relative(root, file)}: id="${data.id}" but directory is "${expectedId}"`);
    }
    if (data.level !== expectedLevel) {
      errors.push(`${relative(root, file)}: level="${data.level}" but directory is "${expectedLevel}"`);
    }
    const expectedUid = `herd.${data.level}.${data.id}`;
    if (data.uid !== expectedUid) {
      errors.push(`${relative(root, file)}: uid="${data.uid}" but should be "${expectedUid}"`);
    }
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
