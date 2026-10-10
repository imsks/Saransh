// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import HeroContent from "@/components/marketing/HeroContent";

afterEach(cleanup);

describe("HeroContent", () => {
  it("keeps the positioning line", () => {
    render(<HeroContent />);

    expect(screen.getByText(/No noise\. Just news\. With proof\./)).toBeTruthy();
    expect(screen.getByText("शोर नहीं। सिर्फ़ खबर। सबूत के साथ।")).toBeTruthy();
  });

  it("describes sourcing without claiming verified publishers", () => {
    const { container } = render(<HeroContent />);

    expect(
      screen.getByText(
        "Saransh pulls from approved sources and gives you a short summary with the source named and linked.",
      ),
    ).toBeTruthy();
    expect(container.textContent).not.toMatch(/verified/i);
    expect(container.textContent).not.toMatch(/every single claim/i);
  });
});
