import { z } from "zod";
import { CapabilityFlagsSchema } from "./capabilities";
import { IntegrationCategory } from "@prisma/client";

/**
 * Sub-etapa 7 — Base manifest schema for IntegrationAdapter.
 *
 * Validates the static metadata each adapter declares about itself. Runtime
 * validation (vs trusting TypeScript-only types like blocks/tools) is the
 * Decision #4 of the spec: a malformed manifest fails fast at registry
 * load instead of crashing some downstream code path later.
 *
 * The schema is intentionally minimal. Per-adapter quirks (credentials shape,
 * configJson shape, OAuth scopes, etc.) live inside the adapter's own code
 * — the manifest is for cross-cutting orchestration concerns only.
 *
 * Zod 3 (`"zod"`) — required by AGENTS.md for code outside the
 * `feature.yml` schema chain. Do not introduce `"zod/v4"` here.
 */

const AuthTypeSchema = z.enum(["token", "oauth2", "basic"]);
export type AuthType = z.infer<typeof AuthTypeSchema>;

export const IntegrationManifestSchema = z.object({
  /** Stable machine identifier — matches `Integration.slug` in the DB. */
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "slug must be kebab-case lowercase (e.g. 'recall-ai')",
    ),
  /** Human-facing display name (e.g. "Gorgias"). */
  name: z.string().min(1),
  /** Maps to Prisma `IntegrationCategory` enum — same values, no aliasing. */
  category: z.nativeEnum(IntegrationCategory),
  /** Coarse capabilities used by orchestrator routing — see `capabilities.ts`. */
  capabilities: CapabilityFlagsSchema,
  /**
   * Event identifiers the provider sends via webhooks. Strings match what
   * the provider puts on the wire (e.g. `"ticket.created"` for Gorgias,
   * `"bot.status_change"` for Recall). Empty array means provider has no
   * webhook surface or we don't subscribe to any events.
   */
  webhookEvents: z.array(z.string()),
  /** How member-level connections authenticate. */
  authType: AuthTypeSchema,
  /**
   * Adapter shape version. Bump on breaking shape changes to manifest or
   * adapter contract for that provider. Format: semver string.
   */
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be semver (x.y.z)"),
});

export type IntegrationManifest = z.infer<typeof IntegrationManifestSchema>;
