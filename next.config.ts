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

  /**
   * Set here rather than in netlify.toml so they follow the app if it moves
   * hosts. The host may add its own — duplicates are harmless.
   *
   * No Content-Security-Policy yet: a useful one needs a per-request nonce for
   * Next's inline bootstrap scripts, and shipping a guessed policy to a live
   * shop breaks checkout rather than hardening it. Worth doing properly, as its
   * own change.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
