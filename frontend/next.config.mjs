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

/**
 * PostHog Cloud US, behind Saransh's own origin (ADR 0004): `*.posthog.com` sits
 * on the default ad-blocker lists, and a Visitor blocked there would vanish from
 * the funnel. Disclosed on /privacy. Both targets are overridable, for another
 * region or a self-hosted instance.
 */
function resolvePostHogProxyTargets() {
  const trim = (url) => url.replace(/\/$/, "");
  return {
    ingest: trim(process.env.POSTHOG_PROXY_INGEST_HOST || "https://us.i.posthog.com"),
    assets: trim(process.env.POSTHOG_PROXY_ASSETS_HOST || "https://us-assets.i.posthog.com"),
  };
}

const posthogProxy = resolvePostHogProxyTargets();

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
      // Assets (the SDK's lazy-loaded session recorder) first: the broader
      // ingest rule below would otherwise swallow them.
      {
        source: "/ingest/static/:path*",
        destination: `${posthogProxy.assets}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogProxy.ingest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
