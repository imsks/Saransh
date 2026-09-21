/** @type {import('next').NextConfig} */

/** Origin for /api/v1 rewrites (host only, no /api/v1 suffix). Same resolution as Rajniti. */
function resolveApiRewriteOrigin() {
  const raw =
    process.env.API_REWRITE_TARGET ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8001/api/v1";
  return raw.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

const apiRewriteOrigin = resolveApiRewriteOrigin();

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1",
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiRewriteOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
