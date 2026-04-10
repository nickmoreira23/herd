import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class KnowledgeProvider implements DataProvider {
  domain = "knowledge";
  types = [
    "document",
    "image",
    "video",
    "audio",
    "link",
    "table",
    "form",
    "rss",
    "app_data",
  ];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const [
      documents,
      images,
      videos,
      audios,
      links,
      tables,
      forms,
      rssEntries,
      appDataPoints,
    ] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          chunkCount: true,
        },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.knowledgeImage.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          chunkCount: true,
        },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.knowledgeVideo.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          duration: true,
          chunkCount: true,
        },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.knowledgeAudio.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          fileType: true,
          duration: true,
          chunkCount: true,
        },
        orderBy: { uploadedAt: "desc" },
      }),
      prisma.knowledgeLink.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          domain: true,
          pagesScraped: true,
          chunkCount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.knowledgeTable.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          recordCount: true,
          fieldCount: true,
          chunkCount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.knowledgeForm.findMany({
        where: { status: "READY", isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          responseCount: true,
          chunkCount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.knowledgeRSSEntry.findMany({
        where: { status: "READY" },
        select: {
          id: true,
          title: true,
          summary: true,
          sourceUrl: true,
          publishedAt: true,
          chunkCount: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 200,
      }),
      prisma.knowledgeAppDataPoint.findMany({
        where: { status: "READY" },
        select: {
          id: true,
          category: true,
          date: true,
          chunkCount: true,
          app: { select: { name: true, slug: true } },
        },
        orderBy: { date: "desc" },
        take: 200,
      }),
    ]);

    const items: CatalogItem[] = [];

    for (const d of documents) {
      items.push({
        id: `document:${d.id}`,
        type: "document",
        domain: this.domain,
        name: d.name,
        description: d.description,
        contentLength: d.chunkCount * 1000,
        extra: `format: ${d.fileType}`,
      });
    }

    for (const i of images) {
      items.push({
        id: `image:${i.id}`,
        type: "image",
        domain: this.domain,
        name: i.name,
        description: i.description,
        contentLength: i.chunkCount * 1000,
        extra: `format: ${i.fileType}`,
      });
    }

    for (const v of videos) {
      items.push({
        id: `video:${v.id}`,
        type: "video",
        domain: this.domain,
        name: v.name,
        description: v.description,
        contentLength: v.chunkCount * 1000,
        extra: `format: ${v.fileType}, duration: ${v.duration ? Math.round(v.duration) + "s" : "unknown"}`,
      });
    }

    for (const a of audios) {
      items.push({
        id: `audio:${a.id}`,
        type: "audio",
        domain: this.domain,
        name: a.name,
        description: a.description,
        contentLength: a.chunkCount * 1000,
        extra: `format: ${a.fileType}, duration: ${a.duration ? Math.round(a.duration) + "s" : "unknown"}`,
      });
    }

    for (const l of links) {
      items.push({
        id: `link:${l.id}`,
        type: "link",
        domain: this.domain,
        name: l.name,
        description: l.description,
        contentLength: l.chunkCount * 1000,
        extra: `domain: ${l.domain}, pages: ${l.pagesScraped}`,
      });
    }

    for (const t of tables) {
      items.push({
        id: `table:${t.id}`,
        type: "table",
        domain: this.domain,
        name: t.name,
        description: t.description,
        contentLength: t.chunkCount * 1000,
        extra: `records: ${t.recordCount}, fields: ${t.fieldCount}`,
      });
    }

    for (const f of forms) {
      items.push({
        id: `form:${f.id}`,
        type: "form",
        domain: this.domain,
        name: f.name,
        description: f.description,
        contentLength: f.chunkCount * 1000,
        extra: `responses: ${f.responseCount}`,
      });
    }

    for (const r of rssEntries) {
      items.push({
        id: `rss:${r.id}`,
        type: "rss",
        domain: this.domain,
        name: r.title,
        description: r.summary,
        contentLength: r.chunkCount * 1000,
        extra: `url: ${r.sourceUrl}${r.publishedAt ? `, published: ${r.publishedAt.toISOString().split("T")[0]}` : ""}`,
      });
    }

    for (const dp of appDataPoints) {
      items.push({
        id: `app_data:${dp.id}`,
        type: "app_data",
        domain: this.domain,
        name: `${dp.app.name} - ${dp.category}`,
        description: null,
        contentLength: dp.chunkCount * 1000,
        extra: `app: ${dp.app.slug}, category: ${dp.category}, date: ${dp.date.toISOString().split("T")[0]}`,
      });
    }

    return items;
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const fetchers: Promise<void>[] = [];

    if (grouped.document) {
      fetchers.push(
        prisma.knowledgeDocument
          .findMany({
            where: { id: { in: grouped.document } },
            select: { id: true, name: true, textContent: true },
          })
          .then((docs) => {
            for (const d of docs)
              results.push({
                id: `document:${d.id}`,
                type: "document",
                name: d.name,
                content: truncate(d.textContent),
              });
          })
      );
    }
    if (grouped.image) {
      fetchers.push(
        prisma.knowledgeImage
          .findMany({
            where: { id: { in: grouped.image } },
            select: { id: true, name: true, textContent: true },
          })
          .then((imgs) => {
            for (const i of imgs)
              results.push({
                id: `image:${i.id}`,
                type: "image",
                name: i.name,
                content: truncate(i.textContent),
              });
          })
      );
    }
    if (grouped.video) {
      fetchers.push(
        prisma.knowledgeVideo
          .findMany({
            where: { id: { in: grouped.video } },
            select: { id: true, name: true, textContent: true },
          })
          .then((vids) => {
            for (const v of vids)
              results.push({
                id: `video:${v.id}`,
                type: "video",
                name: v.name,
                content: truncate(v.textContent),
              });
          })
      );
    }
    if (grouped.audio) {
      fetchers.push(
        prisma.knowledgeAudio
          .findMany({
            where: { id: { in: grouped.audio } },
            select: { id: true, name: true, textContent: true },
          })
          .then((auds) => {
            for (const a of auds)
              results.push({
                id: `audio:${a.id}`,
                type: "audio",
                name: a.name,
                content: truncate(a.textContent),
              });
          })
      );
    }
    if (grouped.link) {
      fetchers.push(
        prisma.knowledgeLink
          .findMany({
            where: { id: { in: grouped.link } },
            select: {
              id: true,
              name: true,
              textContent: true,
              pages: {
                select: { url: true, textContent: true },
                take: 20,
              },
            },
          })
          .then((links) => {
            for (const l of links) {
              const pageContent = l.pages
                .map(
                  (p) => `--- Page: ${p.url} ---\n${p.textContent || ""}`
                )
                .join("\n\n");
              const fullContent = l.textContent
                ? `${l.textContent}\n\n${pageContent}`
                : pageContent;
              results.push({
                id: `link:${l.id}`,
                type: "link",
                name: l.name,
                content: truncate(fullContent),
              });
            }
          })
      );
    }
    if (grouped.table) {
      fetchers.push(
        prisma.knowledgeTable
          .findMany({
            where: { id: { in: grouped.table } },
            select: { id: true, name: true, textContent: true },
          })
          .then((tables) => {
            for (const t of tables)
              results.push({
                id: `table:${t.id}`,
                type: "table",
                name: t.name,
                content: truncate(t.textContent),
              });
          })
      );
    }
    if (grouped.form) {
      fetchers.push(
        prisma.knowledgeForm
          .findMany({
            where: { id: { in: grouped.form } },
            select: { id: true, name: true, textContent: true },
          })
          .then((forms) => {
            for (const f of forms)
              results.push({
                id: `form:${f.id}`,
                type: "form",
                name: f.name,
                content: truncate(f.textContent),
              });
          })
      );
    }
    if (grouped.rss) {
      fetchers.push(
        prisma.knowledgeRSSEntry
          .findMany({
            where: { id: { in: grouped.rss } },
            select: { id: true, title: true, textContent: true },
          })
          .then((entries) => {
            for (const e of entries)
              results.push({
                id: `rss:${e.id}`,
                type: "rss",
                name: e.title,
                content: truncate(e.textContent),
              });
          })
      );
    }
    if (grouped.app_data) {
      fetchers.push(
        prisma.knowledgeAppDataPoint
          .findMany({
            where: { id: { in: grouped.app_data } },
            select: {
              id: true,
              category: true,
              textContent: true,
              date: true,
              app: { select: { name: true } },
            },
          })
          .then((dps) => {
            for (const dp of dps)
              results.push({
                id: `app_data:${dp.id}`,
                type: "app_data",
                name: `${dp.app.name} - ${dp.category} (${dp.date.toISOString().split("T")[0]})`,
                content: truncate(dp.textContent),
              });
          })
      );
    }

    await Promise.all(fetchers);
    return results;
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const shouldSearch = (type: string) =>
      types.length === 0 || types.includes(type);
    const searches: Promise<void>[] = [];

    if (shouldSearch("document")) {
      searches.push(
        prisma.knowledgeDocument
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((docs) => {
            for (const d of docs)
              results.push({
                id: `document:${d.id}`,
                type: "document",
                name: d.name,
                content: truncate(d.textContent),
              });
          })
      );
    }
    if (shouldSearch("image")) {
      searches.push(
        prisma.knowledgeImage
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((imgs) => {
            for (const i of imgs)
              results.push({
                id: `image:${i.id}`,
                type: "image",
                name: i.name,
                content: truncate(i.textContent),
              });
          })
      );
    }
    if (shouldSearch("video")) {
      searches.push(
        prisma.knowledgeVideo
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((vids) => {
            for (const v of vids)
              results.push({
                id: `video:${v.id}`,
                type: "video",
                name: v.name,
                content: truncate(v.textContent),
              });
          })
      );
    }
    if (shouldSearch("audio")) {
      searches.push(
        prisma.knowledgeAudio
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((auds) => {
            for (const a of auds)
              results.push({
                id: `audio:${a.id}`,
                type: "audio",
                name: a.name,
                content: truncate(a.textContent),
              });
          })
      );
    }
    if (shouldSearch("link")) {
      searches.push(
        prisma.knowledgeLink
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((links) => {
            for (const l of links)
              results.push({
                id: `link:${l.id}`,
                type: "link",
                name: l.name,
                content: truncate(l.textContent),
              });
          })
      );
    }
    if (shouldSearch("table")) {
      searches.push(
        prisma.knowledgeTable
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((tables) => {
            for (const t of tables)
              results.push({
                id: `table:${t.id}`,
                type: "table",
                name: t.name,
                content: truncate(t.textContent),
              });
          })
      );
    }
    if (shouldSearch("form")) {
      searches.push(
        prisma.knowledgeForm
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
              isActive: true,
            },
            select: { id: true, name: true, textContent: true },
            take,
          })
          .then((forms) => {
            for (const f of forms)
              results.push({
                id: `form:${f.id}`,
                type: "form",
                name: f.name,
                content: truncate(f.textContent),
              });
          })
      );
    }
    if (shouldSearch("rss")) {
      searches.push(
        prisma.knowledgeRSSEntry
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
            },
            select: { id: true, title: true, textContent: true },
            take,
          })
          .then((entries) => {
            for (const e of entries)
              results.push({
                id: `rss:${e.id}`,
                type: "rss",
                name: e.title,
                content: truncate(e.textContent),
              });
          })
      );
    }
    if (shouldSearch("app_data")) {
      searches.push(
        prisma.knowledgeAppDataPoint
          .findMany({
            where: {
              textContent: { contains: keyword, mode: "insensitive" },
              status: "READY",
            },
            select: {
              id: true,
              category: true,
              textContent: true,
              date: true,
              app: { select: { name: true } },
            },
            take,
          })
          .then((dps) => {
            for (const dp of dps)
              results.push({
                id: `app_data:${dp.id}`,
                type: "app_data",
                name: `${dp.app.name} - ${dp.category} (${dp.date.toISOString().split("T")[0]})`,
                content: truncate(dp.textContent),
              });
          })
      );
    }

    await Promise.all(searches);
    return results;
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const results: ArtifactMeta[] = [];
    const grouped: Record<string, string[]> = {};
    for (const id of ids) {
      // IDs arrive as raw UUIDs (already split by the orchestrator)
      // We need to query all knowledge types since we don't know the subtype here
      // The orchestrator groups by type, so we receive them pre-grouped
      grouped.all = grouped.all || [];
      grouped.all.push(id);
    }

    const fetchers: Promise<void>[] = [];

    // Documents
    fetchers.push(
      prisma.knowledgeDocument
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, fileType: true, chunkCount: true },
        })
        .then((docs) => {
          for (const d of docs)
            results.push({
              id: `document:${d.id}`,
              type: "document",
              name: d.name,
              description: d.description,
              meta: { fileType: d.fileType, chunkCount: d.chunkCount },
            });
        })
    );

    // Images
    fetchers.push(
      prisma.knowledgeImage
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, fileType: true, fileUrl: true },
        })
        .then((imgs) => {
          for (const i of imgs)
            results.push({
              id: `image:${i.id}`,
              type: "image",
              name: i.name,
              description: i.description,
              imageUrl: i.fileUrl,
              meta: { fileType: i.fileType },
            });
        })
    );

    // Videos
    fetchers.push(
      prisma.knowledgeVideo
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, fileType: true, duration: true, thumbnailUrl: true },
        })
        .then((vids) => {
          for (const v of vids)
            results.push({
              id: `video:${v.id}`,
              type: "video",
              name: v.name,
              description: v.description,
              imageUrl: v.thumbnailUrl,
              meta: { fileType: v.fileType, duration: v.duration },
            });
        })
    );

    // Audio
    fetchers.push(
      prisma.knowledgeAudio
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, fileType: true, duration: true },
        })
        .then((auds) => {
          for (const a of auds)
            results.push({
              id: `audio:${a.id}`,
              type: "audio",
              name: a.name,
              description: a.description,
              meta: { fileType: a.fileType, duration: a.duration },
            });
        })
    );

    // Links
    fetchers.push(
      prisma.knowledgeLink
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, domain: true, pagesScraped: true },
        })
        .then((links) => {
          for (const l of links)
            results.push({
              id: `link:${l.id}`,
              type: "link",
              name: l.name,
              description: l.description,
              meta: { domain: l.domain, pagesScraped: l.pagesScraped },
            });
        })
    );

    // Tables
    fetchers.push(
      prisma.knowledgeTable
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, recordCount: true, fieldCount: true },
        })
        .then((tables) => {
          for (const t of tables)
            results.push({
              id: `table:${t.id}`,
              type: "table",
              name: t.name,
              description: t.description,
              meta: { recordCount: t.recordCount, fieldCount: t.fieldCount },
            });
        })
    );

    // Forms
    fetchers.push(
      prisma.knowledgeForm
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, description: true, responseCount: true },
        })
        .then((forms) => {
          for (const f of forms)
            results.push({
              id: `form:${f.id}`,
              type: "form",
              name: f.name,
              description: f.description,
              meta: { responseCount: f.responseCount },
            });
        })
    );

    // RSS
    fetchers.push(
      prisma.knowledgeRSSEntry
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, title: true, summary: true, sourceUrl: true, publishedAt: true },
        })
        .then((entries) => {
          for (const e of entries)
            results.push({
              id: `rss:${e.id}`,
              type: "rss",
              name: e.title,
              description: e.summary,
              meta: { sourceUrl: e.sourceUrl, publishedAt: e.publishedAt?.toISOString() },
            });
        })
    );

    // App Data
    fetchers.push(
      prisma.knowledgeAppDataPoint
        .findMany({
          where: { id: { in: ids } },
          select: { id: true, category: true, date: true, app: { select: { name: true } } },
        })
        .then((dps) => {
          for (const dp of dps)
            results.push({
              id: `app_data:${dp.id}`,
              type: "app_data",
              name: `${dp.app.name} - ${dp.category}`,
              category: dp.category,
              meta: { appName: dp.app.name, date: dp.date.toISOString() },
            });
        })
    );

    await Promise.all(fetchers);
    return results;
  }
}
