import type { PostHog } from "posthog-js";

/** The sign-in funnel; everything else is autocaptured pageviews and clicks. */
type FunnelEvent = "sign_in_clicked" | "signed_in" | "onboarding_completed";

// Imported on demand so the ~100 kB SDK stays out of every page's first load.
const loadPosthog = () => import("posthog-js").then((module) => module.default);

/** Without a key (local, CI) PostHog is never loaded and nothing is sent. */
export function initAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  void loadPosthog().then((posthog) =>
    posthog.init(key, {
      // First-party proxy in next.config.mjs, so ad blockers do not drop Visitors.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",
      defaults: "2026-08-30",
      person_profiles: "identified_only",
      disable_session_recording: true,
    }),
  );
}

function whenReady(run: (posthog: PostHog) => void) {
  void loadPosthog().then((posthog) => {
    if (posthog.__loaded) run(posthog);
  });
}

export function track(event: FunnelEvent, properties: Record<string, unknown>) {
  whenReady((posthog) => posthog.capture(event, properties));
}

/** One ID per person: the anonymous history merges into the shared `users.id`. */
export function identify(userId: string, newUser: boolean) {
  whenReady((posthog) => {
    if (posthog.get_distinct_id() === userId) return;
    posthog.identify(userId);
    posthog.capture("signed_in", { new_user: newUser });
  });
}

export function forgetUser() {
  whenReady((posthog) => posthog.reset());
}
