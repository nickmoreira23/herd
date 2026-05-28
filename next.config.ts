import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: ".",
  },
  cacheComponents: true,
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "sharp", "fluent-ffmpeg"],
  allowedDevOrigins: ["lvh.me", "app.lvh.me", "buckedup.lvh.me"],
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
      // Program → Solutions migration
      { source: "/admin/operation/milestones", destination: "/admin/solutions/operations/milestones", permanent: true },
      { source: "/admin/program/milestones", destination: "/admin/solutions/operations/milestones", permanent: true },
      { source: "/admin/program/packages/:path*", destination: "/admin/solutions/sales/packages/:path*", permanent: true },
      { source: "/admin/program/packages", destination: "/admin/solutions/sales/packages", permanent: true },
      { source: "/admin/program/benefits", destination: "/admin/blocks/products", permanent: true },
      { source: "/admin/program", destination: "/admin/blocks", permanent: true },
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
