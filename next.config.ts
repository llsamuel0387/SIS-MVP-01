import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  distDir,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname)
  },
  /** Tracing root is for production output; in dev it can contribute to stale/wrong server chunk paths. */
  ...(process.env.NODE_ENV === "production" ? { outputFileTracingRoot: path.resolve(__dirname) } : {}),
  async headers() {
    // Next App Router serves inline flight/hydration chunks; without `'unsafe-inline'` (or nonces),
    // production `next start` + Playwright see an empty shell after blocked scripts.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    const baseSecurityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          scriptSrc,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data:",
          "font-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join("; ")
      }
    ] as const;

    /** HSTS는 HTTPS 배포에서만 적용. 로컬 HTTP 개발 시 브라우저가 localhost를 HTTPS 고정하지 않도록 개발에서는 생략. */
    const hstsHeader =
      process.env.NODE_ENV === "production"
        ? ([
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains"
            }
          ] as const)
        : [];

    return [
      {
        source: "/:path*",
        headers: [...baseSecurityHeaders, ...hstsHeader]
      }
    ];
  }
};

export default nextConfig;
