import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
  },
  cacheComponents: true,
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "sharp", "fluent-ffmpeg"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  async rewrites() {
    return [
      {
        // Serve uploaded files from the volume via API route
        // (Next.js standalone doesn't serve runtime-added public/ files)
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
  async redirects() {
    return [
      { source: "/admin/commissions", destination: "/admin/network/promoters", permanent: true },
      { source: "/admin/channels/:path*", destination: "/admin/network/:path*", permanent: true },
      { source: "/admin/operation/milestones", destination: "/admin/program/milestones", permanent: true },
      // Blocks migration — old standalone routes → /admin/blocks/
      { source: "/admin/products/:path*", destination: "/admin/blocks/products/:path*", permanent: true },
      { source: "/admin/brands/:path*", destination: "/admin/blocks/partners/:path*", permanent: true },
      { source: "/admin/partners/:path*", destination: "/admin/blocks/partners/:path*", permanent: true },
      { source: "/admin/perks/:path*", destination: "/admin/blocks/perks/:path*", permanent: true },
      { source: "/admin/community/:path*", destination: "/admin/blocks/community/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
