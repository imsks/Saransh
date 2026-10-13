/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";

import {
  DEFAULT_POSTHOG_HOST,
  readAnalyticsConfig,
} from "@/lib/analytics/config";

const KEY = { NEXT_PUBLIC_POSTHOG_KEY: "phc_test" };

describe("readAnalyticsConfig", () => {
  it("is disabled when no key is configured", () => {
    expect(readAnalyticsConfig({})).toEqual({
      enabled: false,
      key: "",
      host: DEFAULT_POSTHOG_HOST,
    });
  });

  it("treats a blank key as no key", () => {
    expect(
      readAnalyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "   " }).enabled,
    ).toBe(false);
  });

  it("is enabled, through the first-party proxy, when a key is configured", () => {
    expect(readAnalyticsConfig(KEY)).toEqual({
      enabled: true,
      key: "phc_test",
      host: "/ingest",
    });
  });

  it("uses the configured host without its trailing slash", () => {
    expect(
      readAnalyticsConfig({
        ...KEY,
        NEXT_PUBLIC_POSTHOG_HOST: "https://saransh.app/ingest/",
      }).host,
    ).toBe("https://saransh.app/ingest");
  });

  it("falls back to the default host when the host is blank", () => {
    expect(
      readAnalyticsConfig({ ...KEY, NEXT_PUBLIC_POSTHOG_HOST: "  " }).host,
    ).toBe(DEFAULT_POSTHOG_HOST);
  });

  it("accepts the project token variable shown by PostHog", () => {
    expect(
      readAnalyticsConfig({
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: " phc_dashboard ",
      }),
    ).toEqual({ enabled: true, key: "phc_dashboard", host: "/ingest" });
  });

  it("prefers the existing key when both variables are configured", () => {
    expect(
      readAnalyticsConfig({
        ...KEY,
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_other",
      }).key,
    ).toBe("phc_test");
  });

  it("falls back to the project token when the existing key is blank", () => {
    expect(
      readAnalyticsConfig({
        NEXT_PUBLIC_POSTHOG_KEY: " ",
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_dashboard",
      }).key,
    ).toBe("phc_dashboard");
  });

  it("reads the process environment by default", () => {
    // CI and local development run with no key, which is the disabled path.
    expect(readAnalyticsConfig().enabled).toBe(
      Boolean(
        process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
        process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim(),
      ),
    );
  });
});
