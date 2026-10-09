import { afterEach, describe, expect, it, vi } from "vitest";

import { STORIES } from "@/constants/stories";
import StoryCarousel from "@/components/stories/StoryCarousel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("StoryCarousel", () => {
  it("uses local sample stories without fetching from the backend", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const carousel = StoryCarousel();

    expect(carousel.props.stories).toBe(STORIES);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
