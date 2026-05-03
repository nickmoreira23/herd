import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const organizationSlugSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(SLUG_PATTERN, "Slug deve ser lowercase, [a-z0-9-], sem leading/trailing hyphen");

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}
