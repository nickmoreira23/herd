import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";

const PAGESPEED_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const SITE_URL = process.env.SITE_URL || process.env.NEXTAUTH_URL || "";

/**
 * Resolve the API key: prefer the connected integration, fall back to env var.
 */
async function getApiKey(): Promise<string> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "google-pagespeed" },
    });
    if (integration?.status === "CONNECTED" && integration.credentials) {
      const creds = JSON.parse(decrypt(integration.credentials));
      if (creds.apiToken) return creds.apiToken;
    }
  } catch {
    // Fall through to env var
  }
  return process.env.GOOGLE_PAGESPEED_API_KEY || "";
}

interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

interface PageSpeedResult {
  strategy: "mobile" | "desktop";
  scores: {
    performance: number;
    seo: number;
    bestPractices: number;
  };
  webVitals: {
    lcp: { value: string; score: number };
    cls: { value: string; score: number };
    fcp: { value: string; score: number };
    ttfb: { value: string; score: number };
  };
  opportunities: Array<{
    title: string;
    description: string;
    displayValue?: string;
  }>;
}

async function runPageSpeed(
  url: string,
  strategy: "mobile" | "desktop",
  apiKey: string
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({
    url,
    strategy,
    category: "performance",
  });
  // Add additional categories as separate params
  params.append("category", "seo");
  params.append("category", "best-practices");
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(`${PAGESPEED_API}?${params}`, {
    next: { revalidate: 0 }, // Never cache PageSpeed results
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PageSpeed API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const lighthouse = data.lighthouseResult;
  const categories = lighthouse.categories;
  const audits = lighthouse.audits as Record<string, LighthouseAudit>;

  // Extract scores (0-100)
  const scores = {
    performance: Math.round((categories.performance?.score ?? 0) * 100),
    seo: Math.round((categories.seo?.score ?? 0) * 100),
    bestPractices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
  };

  // Extract Core Web Vitals
  const webVitals = {
    lcp: {
      value: audits["largest-contentful-paint"]?.displayValue ?? "N/A",
      score: audits["largest-contentful-paint"]?.score ?? 0,
    },
    cls: {
      value: audits["cumulative-layout-shift"]?.displayValue ?? "N/A",
      score: audits["cumulative-layout-shift"]?.score ?? 0,
    },
    fcp: {
      value: audits["first-contentful-paint"]?.displayValue ?? "N/A",
      score: audits["first-contentful-paint"]?.score ?? 0,
    },
    ttfb: {
      value: audits["server-response-time"]?.displayValue ?? "N/A",
      score: audits["server-response-time"]?.score ?? 0,
    },
  };

  // Extract top opportunities
  const opportunityAudits = Object.values(audits).filter(
    (a) => a.score !== null && a.score < 1 && a.displayValue
  );
  const opportunities = opportunityAudits
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 5)
    .map((a) => ({
      title: a.title,
      description: a.description.replace(/\[.*?\]\(.*?\)/g, "").trim(),
      displayValue: a.displayValue,
    }));

  return { strategy, scores, webVitals, opportunities };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await prisma.landingPage.findUnique({
      where: { id },
      select: { slug: true, status: true },
    });

    if (!page) return apiError("Page not found", 404);
    if (page.status !== "PUBLISHED") {
      return apiError("Page must be published to run performance analysis", 400);
    }

    if (!SITE_URL) {
      return apiError("SITE_URL environment variable is not configured", 500);
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      return apiError(
        "Google PageSpeed API key is not configured. Connect the Google PageSpeed integration under Integrations → Analytics.",
        400
      );
    }

    const url = `${SITE_URL}/p/${page.slug}`;

    // Run mobile and desktop analysis in parallel
    const [mobile, desktop] = await Promise.all([
      runPageSpeed(url, "mobile", apiKey),
      runPageSpeed(url, "desktop", apiKey),
    ]);

    return apiSuccess({ url, mobile, desktop });
  } catch (e) {
    console.error("GET /api/landing-pages/[id]/pagespeed error:", e);
    return apiError(
      e instanceof Error ? e.message : "Failed to run performance analysis",
      500
    );
  }
}
