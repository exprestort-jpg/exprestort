import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Opt into the Cache Components model: `use cache` + cacheLife/cacheTag.
  cacheComponents: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
