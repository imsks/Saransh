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
  // PostHog's API paths end in a slash; redirecting them would break ingestion.
  skipTrailingSlashRedirect: true,
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
      // PostHog Cloud US behind our origin; assets first or /ingest swallows them.
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
