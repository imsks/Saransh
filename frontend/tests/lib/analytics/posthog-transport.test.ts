import type { PostHog } from "posthog-js";
import { describe, expect, it, vi } from "vitest";

import { createPostHogTransport } from "@/lib/analytics/posthog-transport";

function fakeSdk() {
  return {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    startSessionRecording: vi.fn(),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createPostHogTransport", () => {
  it("does not load the SDK until init", async () => {
    const load = vi.fn(async () => fakeSdk() as unknown as PostHog);
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

  it("drops calls quietly when the SDK is blocked", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const transport = createPostHogTransport(() => Promise.reject(new Error("blocked")));

    transport.init("phc_test", {} as never);
    await flush();

    expect(() => transport.capture("waitlist_form_viewed", {})).not.toThrow();
  });
});
