import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import { STORIES } from "@/constants/stories";
import StoryCarousel from "@/components/stories/StoryCarousel";
import StoryCarouselClient from "@/components/stories/StoryCarouselClient";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("StoryCarousel", () => {
  it("renders the branded sample stories by default", async () => {
    const carousel = await StoryCarousel();

    expect(carousel.props.stories).toEqual(STORIES);
    expect(carousel.props.isSample).toBeUndefined();
  });

  it("shows the carousel counter without a sample label in live mode", () => {
    render(
      <StoryCarouselClient stories={STORIES.slice(0, 2)} isSample={false} />,
    );

    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.queryByText("Sample story")).toBeNull();
  });
});
