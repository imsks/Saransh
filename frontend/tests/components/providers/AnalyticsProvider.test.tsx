import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import posthog from "posthog-js";

import AnalyticsProvider from "@/components/providers/AnalyticsProvider";

let init: jest.SpiedFunction<typeof posthog.init>;

beforeEach(() => {
  init = jest.spyOn(posthog, "init").mockImplementation(() => posthog);
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function renderProvider(key: string | undefined) {
  if (key === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  else process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
  render(
    <AnalyticsProvider>
      <p>hello</p>
    </AnalyticsProvider>,
  );
}

describe("AnalyticsProvider", () => {
  it("never boots PostHog without a key", () => {
    renderProvider(undefined);

    expect(screen.getByText("hello")).toBeDefined();
    expect(init).not.toHaveBeenCalled();
  });

  it("boots PostHog through the first-party proxy with replay off", () => {
    renderProvider("phc_test");

    expect(init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        api_host: "/ingest",
        person_profiles: "identified_only",
        disable_session_recording: true,
      }),
    );
  });
});
