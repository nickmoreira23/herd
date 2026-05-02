import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import fastGlob from "fast-glob";
import { parse, stringify } from "yaml";
import { FeatureYmlSchema } from "../schemas/feature.zod";

async function main() {
  const root = resolve(__dirname, "..");
  const handbookRoot = resolve(root, "docs/handbook");
  const outPath = resolve(handbookRoot, "_meta/xrefmap.yml");

  mkdirSync(dirname(outPath), { recursive: true });

  const files = await fastGlob("**/feature.yml", {
    cwd: handbookRoot,
    absolute: true,
  });
  const map: Record<
    string,
    {
      level: string;
      id: string;
      path: string;
      title: { "pt-BR": string; "en-US": string };
    }
  > = {};

  for (const file of files) {
    const data = FeatureYmlSchema.parse(parse(readFileSync(file, "utf-8")));
    map[data.uid] = {
      level: data.level,
      id: data.id,
      path: relative(root, dirname(file)),
      title: data.title,
    };
  }

  const sorted = Object.fromEntries(Object.entries(map).sort());
  writeFileSync(
    outPath,
    "# Auto-generated. Do not edit by hand. Regenerate via npm run gen:xrefmap.\n" +
      stringify({ version: 1, references: sorted }),
    "utf-8",
  );
  console.log(`✓ docs/handbook/_meta/xrefmap.yml (${files.length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
