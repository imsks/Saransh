/**
 * First-party path the browser sends analytics to. `next.config.mjs` rewrites
 * it to PostHog Cloud US — the region chosen in ADR 0004 — so content blockers
 * that list `*.posthog.com` do not silently drop Visitors from the data.
 */
export const DEFAULT_POSTHOG_HOST = "/ingest";

/** PostHog's app, for links the SDK renders (the toolbar). Never receives events. */
export const POSTHOG_UI_HOST = "https://us.posthog.com";

/** Fraction of sessions recorded when no rate is configured. */
export const DEFAULT_REPLAY_SAMPLE_RATE = 0.1;

/** The environment variables analytics reads. */
export interface AnalyticsEnv {
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE?: string;
}

export interface AnalyticsConfig {
  /** False when no project key is configured; every entry point then no-ops. */
  enabled: boolean;
  key: string;
  host: string;
  /** Fraction of sessions to record, from 0 (never) to 1 (always). */
  replaySampleRate: number;
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
    NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE:
      process.env.NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE,
  };
}

/** A blank or unparseable rate falls back to the default; anything else is clamped to [0, 1]. */
function parseSampleRate(raw: string | undefined): number {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DEFAULT_REPLAY_SAMPLE_RATE;
  const rate = Number(trimmed);
  if (!Number.isFinite(rate)) return DEFAULT_REPLAY_SAMPLE_RATE;
  return Math.min(1, Math.max(0, rate));
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
  const key = (env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim();
  const host = (env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim();
  const enabled = key.length > 0;

  return {
    enabled,
    key,
    host: (host || DEFAULT_POSTHOG_HOST).replace(/\/$/, ""),
    replaySampleRate: enabled
      ? parseSampleRate(env.NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE)
      : 0,
  };
}

/**
 * Whether this session is recorded. `roll` is a uniform draw in [0, 1), so a
 * rate of 0 never records and a rate of 1 always does.
 */
export function isSessionSampled(rate: number, roll: number): boolean {
  return roll < rate;
}
