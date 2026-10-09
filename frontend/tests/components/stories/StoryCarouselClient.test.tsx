// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Story } from "@/constants/stories";

import StoryCarouselClient from "@/components/stories/StoryCarouselClient";

function story(headline: string): Story {
  return {
    category: "National",
    time: "2 hrs ago",
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
  vi.useRealTimers();
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

  it("never advances on its own", () => {
    vi.useFakeTimers();
    render(<StoryCarouselClient stories={stories} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
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
});