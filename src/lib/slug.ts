/**
 * Canonical slugify (L2a.2b). The SINGLE normalization used by the taxonomy
 * path — both to author/compare manifest taxonomy keys and to normalize a
 * block item's raw category/subcategory at the marketplace resolver match.
 * Keeping one function guarantees seed and match agree.
 *
 * Lowercase, non-alphanumeric runs collapsed to a single hyphen, no
 * leading/trailing hyphens. Invariant (asserted by tests):
 *   slugify("SUPPLEMENT") === "supplement"
 *   slugify("Pre-Workout") === "pre-workout"
 *
 * NOTE: this does NOT replace the ~8 pre-existing local slug helpers (identity
 * wizards etc.) — only the taxonomy code uses this one.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
