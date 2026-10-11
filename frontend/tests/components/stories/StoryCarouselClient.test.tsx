import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { Story } from "@/constants/stories";

import StoryCarouselClient from "@/components/stories/StoryCarouselClient";

import { analytics } from "@/lib/analytics";

// Spy on the real client: components call it at event time, so every capture lands here.
let capture: jest.SpiedFunction<typeof analytics.capture>;

beforeEach(() => {
  capture = jest.spyOn(analytics, "capture").mockImplementation(() => {});
});

function story(headline: string): Story {
  return {
    category: "National",
    topic: "civic",
    credit: "PTI",
    headline,
    body: "Body copy.",
    source: "PTI",
  };
}

const stories = [
  story("First story"),
  story("Second story"),
  story("Third story"),
];

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("StoryCarouselClient", () => {
  it("starts on the first story with Back disabled", () => {
    render(<StoryCarouselClient stories={stories} />);

    expect(screen.getByText("First story")).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Previous story" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("moves with Next and Back and keeps the counter in step", () => {
    render(<StoryCarouselClient stories={stories} />);

    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    expect(screen.getByText("Second story")).toBeTruthy();
    expect(screen.getByText("2 / 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Previous story" }));
    expect(screen.getByText("First story")).toBeTruthy();
  });

  it("stops at the last story", () => {
    render(<StoryCarouselClient stories={stories} />);
    const next = screen.getByRole("button", { name: "Next story" });

    fireEvent.click(next);
    fireEvent.click(next);

    expect(screen.getByText("Third story")).toBeTruthy();
    expect(next.hasAttribute("disabled")).toBe(true);
  });

  it("auto-advances every 3 seconds and wraps to the first story", () => {
    jest.useFakeTimers();
    render(<StoryCarouselClient stories={stories} />);

    act(() => {
      jest.advanceTimersByTime(2_999);
    });
    expect(screen.getByText("First story")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByText("Second story")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3_000);
    });
    expect(screen.getByText("Third story")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3_000);
    });
    expect(screen.getByText("First story")).toBeTruthy();
  });

  it("ignores a drag shorter than the swipe threshold", () => {
    render(<StoryCarouselClient stories={stories} />);
    const card = screen
      .getByText("First story")
      .closest("[aria-live]") as HTMLElement;

    fireEvent.touchStart(card, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 150 }] });
    expect(screen.getByText("First story")).toBeTruthy();

    fireEvent.touchStart(card, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100 }] });
    expect(screen.getByText("Second story")).toBeTruthy();
  });

  it("renders nothing when there are no stories", () => {
    const { container } = render(<StoryCarouselClient stories={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("labels samples as Sample story", () => {
    render(<StoryCarouselClient stories={stories} isSample />);

    expect(screen.getByText("Sample story")).toBeTruthy();
  });

  it("shows no sample label for live stories", () => {
    render(<StoryCarouselClient stories={stories} />);

    expect(screen.queryByText("Sample story")).toBeNull();
    expect(screen.queryByText(/Live feed/i)).toBeNull();
  });
});

describe("StoryCarouselClient analytics", () => {
  const advances = () =>
    capture.mock.calls
      .filter(([event]) => event === "story_carousel_advanced")
      .map(([, properties]) => properties);

  it("reports a button press with where it landed", () => {
    render(<StoryCarouselClient stories={stories} isSample />);
    fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous story" }));

    expect(advances()).toEqual([
      { direction: "next", method: "button", position: 2, total: 3, sample: true },
      { direction: "back", method: "button", position: 1, total: 3, sample: true },
    ]);
  });

  it("reports a swipe, and not a drag too short to be one", () => {
    render(<StoryCarouselClient stories={stories} />);
    const card = screen.getByText("First story").closest("[aria-live]") as HTMLElement;

    fireEvent.touchStart(card, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 260 }] });
    fireEvent.touchStart(card, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100 }] });

    expect(advances()).toEqual([
      { direction: "next", method: "swipe", position: 2, total: 3, sample: false },
    ]);
  });

  it("reports nothing when the reader is already at the end", () => {
    render(<StoryCarouselClient stories={[story("Only story")]} />);
    const card = screen.getByText("Only story").closest("[aria-live]") as HTMLElement;

    fireEvent.touchStart(card, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 100 }] });

    expect(advances()).toEqual([]);
  });
});
