import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "/*": ["./data/embeddings/**/*", "./data/testset.json"],
  },
  outputFileTracingIncludes: {
    "/*": ["./sources/quran/bn-muhiuddinkhan.txt", "./sources/quran/ur-maududi.txt"],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
