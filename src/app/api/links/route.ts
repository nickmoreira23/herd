import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeLinkSchema } from "@/lib/validators/links";

export async function GET() {
  const links = await prisma.knowledgeLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: links.length,
    pending: links.filter((l) => l.status === "PENDING").length,
    processing: links.filter((l) => l.status === "PROCESSING").length,
    ready: links.filter((l) => l.status === "READY").length,
    error: links.filter((l) => l.status === "ERROR").length,
  };

  return apiSuccess({ links, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeLinkSchema);
  if ("error" in result) return result.error;

  const { url, name, description, scrapeMode, maxPages } = result.data;
  const domain = new URL(url).hostname;

  const link = await prisma.knowledgeLink.create({
    data: {
      url,
      name: name || domain,
      description: description || null,
      domain,
      scrapeMode,
      maxPages,
      status: "PENDING",
    },
  });

  // Fire-and-forget: scrape (single) or crawl (full site)
  const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
  const origin = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
  const endpoint = scrapeMode === "FULL_SITE" ? "crawl" : "scrape";
  fetch(`${origin}/api/knowledge/links/${link.id}/${endpoint}`, {
    method: "POST",
  }).catch(() => {});

  return apiSuccess(link, 201);
}
