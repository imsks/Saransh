import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import posthog from "posthog-js";

import { forgetUser, identify, track } from "@/lib/analytics";

let capture: jest.SpiedFunction<typeof posthog.capture>;
let identifySpy: jest.SpiedFunction<typeof posthog.identify>;
let reset: jest.SpiedFunction<typeof posthog.reset>;
let distinctId = "anon-1";

beforeEach(() => {
  capture = jest.spyOn(posthog, "capture").mockImplementation(() => undefined);
  identifySpy = jest.spyOn(posthog, "identify").mockImplementation(() => {});
  reset = jest.spyOn(posthog, "reset").mockImplementation(() => {});
  jest.spyOn(posthog, "get_distinct_id").mockImplementation(() => distinctId);
});

afterEach(() => {
  jest.restoreAllMocks();
  posthog.__loaded = false;
  distinctId = "anon-1";
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("analytics", () => {
  it("does nothing until PostHog has booted", async () => {
    posthog.__loaded = false;
    track("sign_in_clicked", { location: "hero" });
    identify("google-1", true);
    forgetUser();
    await flush();

    expect(capture).not.toHaveBeenCalled();
    expect(identifySpy).not.toHaveBeenCalled();
    expect(reset).not.toHaveBeenCalled();
  });

  it("sends funnel events once booted", async () => {
    posthog.__loaded = true;
    track("sign_in_clicked", { location: "hero" });
    await flush();

    expect(capture).toHaveBeenCalledWith("sign_in_clicked", { location: "hero" });
  });

  it("merges the anonymous visitor into the User id once, then reports sign-in", async () => {
    posthog.__loaded = true;
    identify("google-1", true);
    await flush();
    distinctId = "google-1";
    identify("google-1", true);
    await flush();

    expect(identifySpy.mock.calls).toEqual([["google-1"]]);
    expect(capture.mock.calls).toEqual([["signed_in", { new_user: true }]]);
  });

  it("forgets the User on sign out", async () => {
    posthog.__loaded = true;
    forgetUser();
    await flush();

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
