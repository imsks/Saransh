/** PostHog Cloud US ingestion host — the region chosen in ADR 0004. */
export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

/** The environment variables analytics reads. */
export interface AnalyticsEnv {
  NEXT_PUBLIC_POSTHOG_KEY?: string;
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
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

/**
 * Turn environment variables into analytics settings. Pure input-output: the
 * single decision it makes is whether analytics runs at all, and it runs only
 * when a non-blank PostHog project key is present. Local development and CI
 * have no key, so they get `enabled: false` and never touch the network.
 */
export function readAnalyticsConfig(
  env: AnalyticsEnv = readEnv(),
): AnalyticsConfig {
  const key = (env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim();
  const host = (env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim();

  return {
    enabled: key.length > 0,
    key,
    host: (host || DEFAULT_POSTHOG_HOST).replace(/\/$/, ""),
  };
}
