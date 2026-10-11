"use client";

import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import posthog from "posthog-js";

import {
  createAnalyticsClient,
  type AnalyticsTransport,
} from "@/lib/analytics/client";

/**
 * Boots the analytics client at the app root and captures a pageview on every
 * route change — Next.js client-side navigations never reload the document, so
 * the SDK's own history listener is off and this effect owns pageviews.
 *
 * With no PostHog key configured the client no-ops, so this mounts and renders
 * exactly the same without making a single request.
 */
function AnalyticsPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useMemo(
    () => createAnalyticsClient(posthog as AnalyticsTransport),
    [],
  );

  useEffect(() => {
    analytics.init();
  }, [analytics]);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    analytics.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}${query ? `?${query}` : ""}`,
    });
  }, [analytics, pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {/* useSearchParams opts the subtree into client rendering; the boundary
          keeps the rest of the page statically rendered. */}
      <Suspense fallback={null}>
        <AnalyticsPageviews />
      </Suspense>
      {children}
    </>
  );
}
