import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Opt into the Cache Components model: `use cache` + cacheLife/cacheTag.
  cacheComponents: true,
  images: {
    // The R2 host is spelled out rather than read from R2_PUBLIC_BASE_URL:
    // this file is evaluated at build time, and requiring the variable on every
    // machine that builds buys nothing. Keep the two in step.
    remotePatterns: [
      // TRANSITIONAL: rows still pointing at Vercel Blob. Drop once the
      // migration has rewritten every URL and the soak period is over.
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
        search: "",
      },
      {
        protocol: "https",
        hostname: "pub-aac04ba5b48c49a599a0787bc10307c7.r2.dev",
        pathname: "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
