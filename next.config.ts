import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const distDir = process.env.NEXT_DIST_DIR || ".next";

const nextConfig: NextConfig = {
  distDir,
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'";

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
