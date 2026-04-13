import * as cheerio from "cheerio";

export interface ParsedFeedMeta {
  title: string;
  description: string | null;
  siteUrl: string | null;
  language: string | null;
}

export interface ParsedFeedEntry {
  guid: string;
  title: string;
  link: string;
  author: string | null;
  publishedAt: Date | null;
  summary: string | null;
  categories: string[];
  imageUrl: string | null;
}

export interface ParsedFeed {
  meta: ParsedFeedMeta;
  entries: ParsedFeedEntry[];
}

const FETCH_TIMEOUT = 15_000;
const USER_AGENT = "Mozilla/5.0 (compatible; HERDBot/1.0; +https://herd.app)";

/**
 * Fetches and parses an RSS 2.0 or Atom feed URL.
 * If the URL returns HTML instead of XML, attempts to auto-discover a feed link.
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  const xml = await fetchFeedXml(feedUrl);
  const $ = cheerio.load(xml, { xml: true });

  // Detect feed format
  if ($("rss").length > 0 || $("rdf\\:RDF").length > 0) {
    return parseRSS($, feedUrl);
  }

  if ($("feed").length > 0) {
    return parseAtom($, feedUrl);
  }

  // Maybe it's HTML — try auto-discovery
  const htmlDoc = cheerio.load(xml);
  const feedLink =
    htmlDoc('link[type="application/rss+xml"]').attr("href") ||
    htmlDoc('link[type="application/atom+xml"]').attr("href");

  if (feedLink) {
    const resolvedUrl = new URL(feedLink, feedUrl).href;
    const discoveredXml = await fetchFeedXml(resolvedUrl);
    const $discovered = cheerio.load(discoveredXml, { xml: true });

    if ($discovered("rss").length > 0 || $discovered("rdf\\:RDF").length > 0) {
      return parseRSS($discovered, resolvedUrl);
    }
    if ($discovered("feed").length > 0) {
      return parseAtom($discovered, resolvedUrl);
    }
  }

  throw new Error("Could not detect RSS or Atom feed at this URL");
}

async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.text();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Feed request timed out after 15 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseRSS(
  $: cheerio.CheerioAPI,
  feedUrl: string
): ParsedFeed {
  const channel = $("channel").first();

  const meta: ParsedFeedMeta = {
    title: channel.children("title").first().text().trim() || new URL(feedUrl).hostname,
    description: channel.children("description").first().text().trim() || null,
    siteUrl: channel.children("link").first().text().trim() || null,
    language: channel.children("language").first().text().trim() || null,
  };

  const entries: ParsedFeedEntry[] = [];

  $("item").each((_, el) => {
    const item = $(el);
    const link = item.children("link").first().text().trim();
    const guid =
      item.children("guid").first().text().trim() || link || "";

    if (!guid) return;

    const pubDate = item.children("pubDate").first().text().trim();
    const dcDate = item.children("dc\\:date").first().text().trim();

    const categories: string[] = [];
    item.children("category").each((_, cat) => {
      const text = $(cat).text().trim();
      if (text) categories.push(text);
    });

    const enclosureUrl = item.find("enclosure[type^='image']").attr("url") || null;
    const mediaContent =
      item.find("media\\:content[medium='image'], media\\:content[type^='image']").attr("url") ||
      item.find("media\\:thumbnail").attr("url") ||
      null;

    entries.push({
      guid,
      title: item.children("title").first().text().trim() || "Untitled",
      link,
      author:
        item.children("dc\\:creator").first().text().trim() ||
        item.children("author").first().text().trim() ||
        null,
      publishedAt: parseDate(pubDate || dcDate),
      summary:
        item.children("description").first().text().trim().slice(0, 1000) ||
        null,
      categories,
      imageUrl: enclosureUrl || mediaContent,
    });
  });

  return { meta, entries };
}

function parseAtom(
  $: cheerio.CheerioAPI,
  feedUrl: string
): ParsedFeed {
  const feed = $("feed").first();

  const siteLink =
    feed.children('link[rel="alternate"]').attr("href") ||
    feed.children("link").not('[rel="self"]').attr("href") ||
    null;

  const meta: ParsedFeedMeta = {
    title: feed.children("title").first().text().trim() || new URL(feedUrl).hostname,
    description:
      feed.children("subtitle").first().text().trim() ||
      feed.children("tagline").first().text().trim() ||
      null,
    siteUrl: siteLink ? new URL(siteLink, feedUrl).href : null,
    language: feed.attr("xml:lang") || null,
  };

  const entries: ParsedFeedEntry[] = [];

  $("entry").each((_, el) => {
    const entry = $(el);
    const link =
      entry.children('link[rel="alternate"]').attr("href") ||
      entry.children("link").attr("href") ||
      "";
    const resolvedLink = link ? new URL(link, feedUrl).href : "";
    const guid =
      entry.children("id").first().text().trim() || resolvedLink || "";

    if (!guid) return;

    const updated = entry.children("updated").first().text().trim();
    const published = entry.children("published").first().text().trim();

    const categories: string[] = [];
    entry.children("category").each((_, cat) => {
      const term = $(cat).attr("term") || $(cat).text().trim();
      if (term) categories.push(term);
    });

    const summary =
      entry.children("summary").first().text().trim() ||
      entry.children("content").first().text().trim().slice(0, 1000) ||
      null;

    entries.push({
      guid,
      title: entry.children("title").first().text().trim() || "Untitled",
      link: resolvedLink,
      author: entry.find("author > name").first().text().trim() || null,
      publishedAt: parseDate(published || updated),
      summary: summary?.slice(0, 1000) || null,
      categories,
      imageUrl: null,
    });
  });

  return { meta, entries };
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
