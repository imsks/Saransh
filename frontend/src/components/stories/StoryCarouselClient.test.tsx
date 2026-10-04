// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Story } from "@/constants/stories";

import StoryCarouselClient from "./StoryCarouselClient";

function story(headline: string): Story {
  return {
    category: "National",
    time: "2 hrs ago",
    imageVariant: "national",
    credit: "PTI",
    headline,
    body: "Body copy.",
    source: "PTI · Verified",
  };
}

const stories = [story("First story"), story("Second story"), story("Third story")];

function setReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

const ADVANCE_MS = 4200;

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("StoryCarouselClient", () => {
  it("advances to the next story on its own", () => {
    render(<StoryCarouselClient stories={stories} />);
    expect(screen.getByText("First story")).toBeTruthy();

    advance(ADVANCE_MS);
    expect(screen.getByText("Second story")).toBeTruthy();
  });

  it("pauses while the pointer is over it and resumes afterwards", () => {
    const { container } = render(<StoryCarouselClient stories={stories} />);
    const root = container.firstElementChild as HTMLElement;

    fireEvent.mouseEnter(root);
    advance(ADVANCE_MS * 3);
    expect(screen.getByText("First story")).toBeTruthy();

    fireEvent.mouseLeave(root);
    advance(ADVANCE_MS);
    expect(screen.getByText("Second story")).toBeTruthy();
  });

  it("pauses while keyboard focus is inside it", () => {
    render(<StoryCarouselClient stories={stories} />);
    const firstDot = screen.getByRole("button", { name: "Story 1" });

    fireEvent.focus(firstDot);
    advance(ADVANCE_MS * 3);
    expect(screen.getByText("First story")).toBeTruthy();

    fireEvent.blur(firstDot);
    advance(ADVANCE_MS);
    expect(screen.getByText("Second story")).toBeTruthy();
  });

  it("does not advance for readers who prefer reduced motion", () => {
    setReducedMotion(true);
    render(<StoryCarouselClient stories={stories} />);

    advance(ADVANCE_MS * 3);
    expect(screen.getByText("First story")).toBeTruthy();
  });

  it("marks the current dot and lets the reader pick a story", () => {
    render(<StoryCarouselClient stories={stories} />);

    expect(screen.getByRole("button", { name: "Story 1" }).getAttribute("aria-current")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Story 3" }));

    expect(screen.getByText("Third story")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Story 3" }).getAttribute("aria-current")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Story 1" }).getAttribute("aria-current")).toBeNull();
  });
});
