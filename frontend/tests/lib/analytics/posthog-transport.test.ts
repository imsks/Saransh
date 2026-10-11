/**
 * @jest-environment node
 */
import type { PostHog } from "posthog-js";
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { createPostHogTransport } from "@/lib/analytics/posthog-transport";

function fakeSdk() {
  return {
    init: jest.fn<(...args: unknown[]) => void>(),
    capture: jest.fn<(event: string, ...rest: unknown[]) => void>(),
    identify: jest.fn<(...args: unknown[]) => void>(),
    reset: jest.fn<() => void>(),
    startSessionRecording: jest.fn<() => void>(),
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createPostHogTransport", () => {
  it("does not load the SDK until init", async () => {
    const load = jest.fn(async () => fakeSdk() as unknown as PostHog);
    const transport = createPostHogTransport(load);

    transport.capture("waitlist_form_viewed", {});
    await flush();

    expect(load).not.toHaveBeenCalled();
  });

  it("replays calls made while the SDK downloads, in order", async () => {
    const sdk = fakeSdk();
    const order: string[] = [];
    sdk.init.mockImplementation(() => order.push("init"));
    sdk.capture.mockImplementation((event: string) => order.push(event));
    const transport = createPostHogTransport(async () => sdk as unknown as PostHog);

    transport.init("phc_test", {} as never);
    transport.capture("waitlist_form_viewed", {});
    expect(order).toEqual([]);

    await flush();

    expect(order).toEqual(["init", "waitlist_form_viewed"]);
  });

  it("forwards identify, reset and recording once loaded", async () => {
    const sdk = fakeSdk();
    const transport = createPostHogTransport(async () => sdk as unknown as PostHog);
    transport.init("phc_test", {} as never);
    await flush();

    transport.identify("signup-token");
    transport.startSessionRecording();
    transport.reset();

    expect(sdk.identify).toHaveBeenCalledWith("signup-token");
    expect(sdk.startSessionRecording).toHaveBeenCalledTimes(1);
    expect(sdk.reset).toHaveBeenCalledTimes(1);
  });

  it("swallows a call the SDK throws on", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const sdk = fakeSdk();
    sdk.capture.mockImplementation(() => {
      throw new Error("sdk exploded");
    });
    const transport = createPostHogTransport(async () => sdk as unknown as PostHog);
    transport.init("phc_test", {} as never);
    await flush();

    expect(() => transport.capture("waitlist_form_viewed", {})).not.toThrow();
  });

  it("drops calls quietly when the SDK is blocked", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const transport = createPostHogTransport(() => Promise.reject(new Error("blocked")));

    transport.init("phc_test", {} as never);
    await flush();

    expect(() => transport.capture("waitlist_form_viewed", {})).not.toThrow();
  });
});
