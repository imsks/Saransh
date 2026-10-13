import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import WhatSection from "@/components/marketing/WhatSection";
import { STORIES } from "@/constants/stories";

afterEach(cleanup);

describe("WhatSection", () => {
  it("renders all the branded sample stories with unchanged default labeling", () => {
    render(<WhatSection />);

    expect(screen.getByText(`1 / ${STORIES.length}`)).toBeTruthy();
    expect(screen.queryByText("Sample story")).toBeNull();
    for (const story of STORIES) {
      expect(screen.getByText(story.headline)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Next story" }));
    }
  });

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
