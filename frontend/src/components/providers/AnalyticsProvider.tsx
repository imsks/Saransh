"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { analytics } from "@/lib/analytics";
import type { ScrollDepth } from "@/lib/analytics/events";
import { newMilestones, scrollFraction } from "@/lib/analytics/scroll";

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

  useEffect(() => {
    analytics.init();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    analytics.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}${query ? `?${query}` : ""}`,
    });
  }, [pathname, searchParams]);

  useScrollDepth(pathname);

  return null;
}

/**
 * Reports each scroll milestone once per page view. The listener is passive
 * and does its work at most once a frame, so it never holds up scrolling.
 */
function useScrollDepth(pathname: string | null) {
  useEffect(() => {
    const reported = new Set<ScrollDepth>();
    let frame: number | null = null;

    const measure = () => {
      frame = null;
      const fraction = scrollFraction(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
      );
      for (const depth of newMilestones(fraction, reported)) {
        reported.add(depth);
        analytics.capture("scroll_depth_reached", { depth });
      }
    };

    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);
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
