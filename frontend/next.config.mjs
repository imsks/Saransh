/** @type {import('next').NextConfig} */

function resolveApiRewriteOrigin() {
  const raw =
    process.env.API_REWRITE_TARGET ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    "http://127.0.0.1:8001";
  return raw.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

const apiRewriteOrigin = resolveApiRewriteOrigin();

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1",
    NEXT_PUBLIC_API_ORIGIN:
      process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:8001",
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiRewriteOrigin}/api/v1/:path*`,
      },
      {
        source: "/api/stories/:path*",
        destination: `${apiRewriteOrigin}/api/stories/:path*`,
      },
      {
        source: "/api/stories",
        destination: `${apiRewriteOrigin}/api/stories`,
      },
    ];
  },
};

export default nextConfig;
