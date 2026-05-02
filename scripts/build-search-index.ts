import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parse } from "yaml";
import fastGlob from "fast-glob";
import { FeatureYmlSchema } from "../schemas/feature.zod";

interface IndexEntry {
  uid: string;
  id: string;
  level: string;
  parent: string | null;
  status: string;
  owners: string[];
  since: string;
  updated: string;
  consumes: string[];
  consumed_by: string[];
  related: string[];
  title_pt_BR: string;
  title_en_US: string;
  description_pt_BR: string;
  description_en_US: string;
  body_pt_BR: string;
  body_en_US: string;
}

async function main() {
  const root = resolve(__dirname, "..");
  const handbookRoot = resolve(root, "docs/handbook");
  const outPath = resolve(root, "mcp/generated/search-index.json");

  mkdirSync(dirname(outPath), { recursive: true });

  const files = await fastGlob("**/feature.yml", {
    cwd: handbookRoot,
    absolute: true,
  });
  files.sort();
  const entries: IndexEntry[] = [];

  for (const file of files) {
    const data = FeatureYmlSchema.parse(parse(readFileSync(file, "utf-8")));
    const dir = dirname(file);
    const ptPath = resolve(dir, "pt-BR.md");
    const enPath = resolve(dir, "en-US.md");

    entries.push({
      uid: data.uid,
      id: data.id,
      level: data.level,
      parent: data.parent ?? null,
      status: data.status,
      owners: data.owners,
      since: data.since,
      updated: data.updated,
      consumes: data.consumes,
      consumed_by: data.consumed_by,
      related: data.related,
      title_pt_BR: data.title["pt-BR"],
      title_en_US: data.title["en-US"],
      description_pt_BR: data.description["pt-BR"],
      description_en_US: data.description["en-US"],
      body_pt_BR: existsSync(ptPath) ? readFileSync(ptPath, "utf-8") : "",
      body_en_US: existsSync(enPath) ? readFileSync(enPath, "utf-8") : "",
    });
  }

  writeFileSync(
    outPath,
    JSON.stringify({ version: 1, entries }, null, 2) + "\n",
    "utf-8",
  );
  console.log(`✓ mcp/generated/search-index.json (${entries.length} entries)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
