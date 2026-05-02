import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import * as z from "zod/v4";
import { FeatureYmlSchema } from "../schemas/feature.zod";

const outDir = resolve(__dirname, "../schemas");
mkdirSync(outDir, { recursive: true });

const jsonSchema = z.toJSONSchema(FeatureYmlSchema, { target: "draft-2020-12" });

writeFileSync(
  resolve(outDir, "feature.schema.json"),
  JSON.stringify(jsonSchema, null, 2) + "\n",
  "utf-8",
);

console.log("✓ schemas/feature.schema.json regenerated");
