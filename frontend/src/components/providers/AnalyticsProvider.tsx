"use client";

import posthog from "posthog-js";
import { useEffect, type ReactNode } from "react";

/** Boots PostHog once; without a key (local, CI) it never loads or sends anything. */
export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      // First-party proxy in next.config.mjs, so ad blockers do not drop Visitors.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-08-30",
      person_profiles: "identified_only",
      disable_session_recording: true,
    });
  }, []);

  return <>{children}</>;
}
