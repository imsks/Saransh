import { describe, expect, it } from "vitest";

import { DEFAULT_POSTHOG_HOST, readAnalyticsConfig } from "./config";

describe("readAnalyticsConfig", () => {
  it("is disabled when no key is configured", () => {
    expect(readAnalyticsConfig({})).toEqual({
      enabled: false,
      key: "",
      host: DEFAULT_POSTHOG_HOST,
    });
  });

  it("treats a blank key as no key", () => {
    expect(readAnalyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "   " }).enabled).toBe(
      false,
    );
  });

  it("is enabled when a key is configured", () => {
    expect(
      readAnalyticsConfig({ NEXT_PUBLIC_POSTHOG_KEY: "phc_test" }),
    ).toEqual({
      enabled: true,
      key: "phc_test",
      host: DEFAULT_POSTHOG_HOST,
    });
  });

  it("uses the configured host without its trailing slash", () => {
    expect(
      readAnalyticsConfig({
        NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
        NEXT_PUBLIC_POSTHOG_HOST: "https://saransh.app/ingest/",
      }).host,
    ).toBe("https://saransh.app/ingest");
  });

  it("falls back to the default host when the host is blank", () => {
    expect(
      readAnalyticsConfig({
        NEXT_PUBLIC_POSTHOG_KEY: "phc_test",
        NEXT_PUBLIC_POSTHOG_HOST: "  ",
      }).host,
    ).toBe(DEFAULT_POSTHOG_HOST);
  });

  it("reads the process environment by default", () => {
    // CI and local development run with no key, which is the disabled path.
    expect(readAnalyticsConfig().enabled).toBe(
      Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
    );
  });
});
