import { describe, expect, it } from "vitest";

import {
  DEFAULT_POSTHOG_HOST,
  DEFAULT_REPLAY_SAMPLE_RATE,
  isSessionSampled,
  readAnalyticsConfig,
} from "@/lib/analytics/config";

const KEY = { NEXT_PUBLIC_POSTHOG_KEY: "phc_test" };

describe("readAnalyticsConfig", () => {
  it("is disabled, with replay off, when no key is configured", () => {
    expect(readAnalyticsConfig({})).toEqual({
      enabled: false,
      key: "",
      host: DEFAULT_POSTHOG_HOST,
      replaySampleRate: 0,
    });
  });

  it("treats a blank key as no key", () => {
    expect(readAnalyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "   " }).enabled).toBe(false);
  });

  it("ignores a replay rate when no key is configured", () => {
    expect(
      readAnalyticsConfig({ NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE: "1" }).replaySampleRate,
    ).toBe(0);
  });

  it("is enabled, through the first-party proxy, when a key is configured", () => {
    expect(readAnalyticsConfig(KEY)).toEqual({
      enabled: true,
      key: "phc_test",
      host: "/ingest",
      replaySampleRate: DEFAULT_REPLAY_SAMPLE_RATE,
    });
  });

  it("uses the configured host without its trailing slash", () => {
    expect(
      readAnalyticsConfig({ ...KEY, NEXT_PUBLIC_POSTHOG_HOST: "https://saransh.app/ingest/" })
        .host,
    ).toBe("https://saransh.app/ingest");
  });

  it("falls back to the default host when the host is blank", () => {
    expect(readAnalyticsConfig({ ...KEY, NEXT_PUBLIC_POSTHOG_HOST: "  " }).host).toBe(
      DEFAULT_POSTHOG_HOST,
    );
  });

  it.each([
    ["0", 0],
    ["0.25", 0.25],
    ["1", 1],
    ["  0.5 ", 0.5],
    ["-0.3", 0],
    ["4", 1],
  ])("reads a replay rate of %j as %d", (raw, rate) => {
    expect(
      readAnalyticsConfig({ ...KEY, NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE: raw })
        .replaySampleRate,
    ).toBe(rate);
  });

  it.each(["", "  ", "half", "NaN"])(
    "falls back to the default replay rate for %j",
    (raw) => {
      expect(
        readAnalyticsConfig({ ...KEY, NEXT_PUBLIC_POSTHOG_REPLAY_SAMPLE_RATE: raw })
          .replaySampleRate,
      ).toBe(DEFAULT_REPLAY_SAMPLE_RATE);
    },
  );

  it("reads the process environment by default", () => {
    // CI and local development run with no key, which is the disabled path.
    expect(readAnalyticsConfig().enabled).toBe(
      Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
    );
  });
});

describe("isSessionSampled", () => {
  it("never records at a rate of 0, even on the lowest roll", () => {
    expect(isSessionSampled(0, 0)).toBe(false);
  });

  it("always records at a rate of 1, even on the highest roll", () => {
    expect(isSessionSampled(1, 0.999999)).toBe(true);
  });

  it("records a roll just under the rate and not one at it", () => {
    expect(isSessionSampled(0.1, 0.0999)).toBe(true);
    expect(isSessionSampled(0.1, 0.1)).toBe(false);
  });
});
