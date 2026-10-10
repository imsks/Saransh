// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import WhatSection from "@/components/marketing/WhatSection";

vi.mock("@/components/stories/StoryCarousel", () => ({
  default: () => <div data-testid="story-carousel" />,
}));

afterEach(cleanup);

describe("WhatSection", () => {
  it("claims no ranking logic and words human review as being built", () => {
    const { container } = render(<WhatSection />);

    expect(container.textContent).not.toMatch(/ranking/i);
    expect(screen.getByText("SOURCED, WITH A LINK")).toBeTruthy();
    expect(screen.getByText("OPEN SOURCE")).toBeTruthy();
    expect(screen.getByText("HUMAN REVIEW: BEING BUILT")).toBeTruthy();
    expect(container.textContent).toContain(
      "will be approved by a person before it goes live",
    );
    expect(container.textContent).toContain(
      "We are building the review step now.",
    );
  });
});
