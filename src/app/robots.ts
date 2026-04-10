import type { MetadataRoute } from "next";

const SITE_URL = process.env.SITE_URL || process.env.NEXTAUTH_URL || "https://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/p/",
        disallow: ["/admin/", "/api/", "/login"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
