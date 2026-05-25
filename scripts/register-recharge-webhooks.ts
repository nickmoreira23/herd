import "dotenv/config";

import { RechargeService, type RechargeWebhook } from "@/lib/services/recharge";
import { rechargeAdapter } from "@/lib/integrations/integrations/recharge.integration";

/**
 * Sub-etapa 10.0.2 — programmatic Recharge webhook registration.
 *
 * The bucked_up_herd_hl headless account does not expose webhook
 * management in the Recharge UI. This script is the source of truth
 * for which topics are registered against our /api/webhooks/recharge
 * endpoint.
 *
 * Behavior:
 *   1. Resolve base URL (--base-url > NEXTAUTH_URL). Abort on localhost.
 *   2. List existing webhooks via Recharge API.
 *   3. Diff vs manifest topics (rechargeAdapter.manifest.webhookEvents).
 *   4. Create missing. `charge/paid` falls back to `charge/succeeded` on 422.
 *   5. With --delete-obsolete: delete webhooks at our address whose topic
 *      is not in the manifest.
 *   6. --dry-run shows the plan without executing.
 *
 * Source of truth: rechargeAdapter.manifest.webhookEvents.
 */

const LOG_PREFIX = "[recharge:register-webhooks]";
const WEBHOOK_PATH = "/api/webhooks/recharge";

interface ParsedArgs {
  baseUrl: string | null;
  deleteObsolete: boolean;
  dryRun: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {
    baseUrl: null,
    deleteObsolete: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--base-url" && args[i + 1]) {
      result.baseUrl = args[++i];
    } else if (arg === "--delete-obsolete") {
      result.deleteObsolete = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return result;
}

function printHelp(): void {
  console.log(`${LOG_PREFIX} Usage:
  npm run recharge:register-webhooks -- [options]

Options:
  --base-url <url>       Override webhook base URL (default: NEXTAUTH_URL env)
  --delete-obsolete      Delete webhooks registered for topics not in manifest
  --dry-run              Show plan without executing changes
  --help                 Show this help

Behavior:
  Reads webhook topics from rechargeAdapter.manifest.webhookEvents.
  Lists existing webhooks via Recharge API.
  Diffs: creates missing topics, optionally deletes obsolete ones.
  Aborts if resolved base-url is localhost (Recharge requires HTTPS).

Examples:
  npm run recharge:register-webhooks
  npm run recharge:register-webhooks -- --base-url https://comecaai.example.com
  npm run recharge:register-webhooks -- --dry-run
  npm run recharge:register-webhooks -- --delete-obsolete
`);
}

function resolveBaseUrl(override: string | null): string {
  const url = override || process.env.NEXTAUTH_URL || "";
  if (!url) {
    throw new Error(
      "No base URL: pass --base-url or set NEXTAUTH_URL in the environment.",
    );
  }
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    throw new Error(
      `Refusing to register webhooks with localhost URL "${url}". ` +
        `Recharge requires HTTPS. Use --base-url <prod-url> or run from a ` +
        `production environment with NEXTAUTH_URL set to the public URL.`,
    );
  }
  if (!url.startsWith("https://")) {
    throw new Error(`Base URL must use HTTPS: ${url}`);
  }
  return url.replace(/\/+$/, "");
}

interface TopicAttempt {
  manifestTopic: string;
  attemptOrder: string[];
}

function buildTopicAttempts(manifestTopics: readonly string[]): TopicAttempt[] {
  return manifestTopics.map((topic) => {
    // charge/paid is the manifest convention; some Recharge API versions reject
    // it and require charge/succeeded. Try primary, fall back on 422.
    if (topic === "charge/paid") {
      return {
        manifestTopic: topic,
        attemptOrder: ["charge/paid", "charge/succeeded"],
      };
    }
    return { manifestTopic: topic, attemptOrder: [topic] };
  });
}

function is422(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: string }).message ?? "";
  return /\b422\b/.test(message);
}

async function main(): Promise<void> {
  const args = parseArgs();
  const baseUrl = resolveBaseUrl(args.baseUrl);
  const webhookAddress = `${baseUrl}${WEBHOOK_PATH}`;

  console.log(`${LOG_PREFIX} Base URL:        ${baseUrl}`);
  console.log(`${LOG_PREFIX} Webhook address: ${webhookAddress}`);
  console.log(`${LOG_PREFIX} Mode:            ${args.dryRun ? "DRY RUN" : "EXECUTE"}`);
  console.log("");

  const service = await RechargeService.fromIntegration();

  // 1. List existing webhooks.
  console.log(`${LOG_PREFIX} Fetching existing webhooks...`);
  const existing = await service.listWebhooks();
  console.log(`${LOG_PREFIX} Found ${existing.length} existing webhooks.`);

  // Index existing by (topic|address).
  const existingByKey = new Map<string, RechargeWebhook>();
  for (const wh of existing) {
    existingByKey.set(`${wh.topic}|${wh.address}`, wh);
  }

  // 2. Compute diff vs manifest.
  const manifestTopics = rechargeAdapter.manifest.webhookEvents;
  const topicAttempts = buildTopicAttempts(manifestTopics);

  const toCreate: TopicAttempt[] = [];
  const matched: string[] = [];

  for (const attempt of topicAttempts) {
    const foundVariant = attempt.attemptOrder.find((variant) =>
      existingByKey.has(`${variant}|${webhookAddress}`),
    );
    if (foundVariant) {
      matched.push(foundVariant);
      existingByKey.delete(`${foundVariant}|${webhookAddress}`);
    } else {
      toCreate.push(attempt);
    }
  }

  // Whatever remains at our address but not in manifest is obsolete.
  const obsolete: RechargeWebhook[] = Array.from(existingByKey.values()).filter(
    (wh) => wh.address === webhookAddress,
  );

  // 3. Report plan.
  console.log("");
  console.log(`${LOG_PREFIX} Plan:`);
  console.log(`  Matched (no-op): ${matched.length} topics`);
  for (const t of matched) {
    console.log(`    ✓ ${t}`);
  }
  console.log(`  To create: ${toCreate.length} topics`);
  for (const t of toCreate) {
    const fallback =
      t.attemptOrder.length > 1
        ? ` (fallback: ${t.attemptOrder.slice(1).join(",")})`
        : "";
    console.log(`    + ${t.manifestTopic}${fallback}`);
  }
  if (obsolete.length > 0) {
    const action = args.deleteObsolete
      ? "will delete"
      : "WILL KEEP — use --delete-obsolete to remove";
    console.log(`  Obsolete (${action}): ${obsolete.length}`);
    for (const wh of obsolete) {
      console.log(`    - id=${wh.id} topic=${wh.topic}`);
    }
  }
  console.log("");

  if (args.dryRun) {
    console.log(`${LOG_PREFIX} Dry run complete. No changes made.`);
    return;
  }

  // 4. Execute creates.
  for (const attempt of toCreate) {
    let created = false;
    for (const variant of attempt.attemptOrder) {
      try {
        const result = await service.createWebhook(variant, webhookAddress);
        console.log(`${LOG_PREFIX} ✓ Created topic=${variant} id=${result.id}`);
        created = true;
        break;
      } catch (err) {
        const last =
          variant === attempt.attemptOrder[attempt.attemptOrder.length - 1];
        if (is422(err) && !last) {
          console.log(
            `${LOG_PREFIX} ⚠ topic=${variant} rejected (422). Trying fallback...`,
          );
          continue;
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `${LOG_PREFIX} ✗ Failed to create topic=${variant}: ${msg}`,
        );
        throw err;
      }
    }
    if (!created) {
      throw new Error(
        `Failed to create webhook for ${attempt.manifestTopic} after all attempts: ` +
          attempt.attemptOrder.join(","),
      );
    }
  }

  // 5. Execute deletes (if --delete-obsolete).
  if (args.deleteObsolete) {
    for (const wh of obsolete) {
      try {
        await service.deleteWebhook(String(wh.id));
        console.log(
          `${LOG_PREFIX} ✓ Deleted obsolete id=${wh.id} topic=${wh.topic}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} ✗ Failed to delete id=${wh.id}: ${msg}`);
        throw err;
      }
    }
  }

  console.log(`${LOG_PREFIX} Done.`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`${LOG_PREFIX} ERROR: ${msg}`);
  process.exit(1);
});
