/**
 * First-party path the browser sends analytics to. `next.config.mjs` rewrites
 * it to PostHog Cloud US — the region chosen in ADR 0004 — so content blockers
 * that list `*.posthog.com` do not silently drop Visitors from the data.
 */
export const DEFAULT_POSTHOG_HOST = "/ingest";

/** PostHog's app, for links the SDK renders (the toolbar). Never receives events. */
export const POSTHOG_UI_HOST = "https://us.posthog.com";

/** The environment variables analytics reads. */
export interface AnalyticsEnv {
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
}

export interface AnalyticsConfig {
  /** False when no project key is configured; every entry point then no-ops. */
  enabled: boolean;
  key: string;
  host: string;
}

/**
 * Next.js inlines `process.env.NEXT_PUBLIC_*` only at literal property reads,
 * so the browser bundle needs these spelled out rather than indexed off
 * `process.env` dynamically.
 */
function readEnv(): AnalyticsEnv {
  return {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

/**
 * Turn environment variables into analytics settings. Pure input-output: the
 * main decision it makes is whether analytics runs at all, and it runs only
 * when a non-blank PostHog project key is present. Local development and CI
 * have no key, so they get `enabled: false` and never touch the network.
 */
export function readAnalyticsConfig(
  env: AnalyticsEnv = readEnv(),
): AnalyticsConfig {
  const key =
    (env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim() ||
    (env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "").trim();
  const host = (env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim();
  const enabled = key.length > 0;

  return {
    enabled,
    key,
    host: (host || DEFAULT_POSTHOG_HOST).replace(/\/$/, ""),
  };
}
