import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";

import HeroContent from "@/components/marketing/HeroContent";

afterEach(cleanup);

describe("HeroContent", () => {
  it("shows the sourcing and accountability headline", () => {
    render(<HeroContent />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("India's news.");
    expect(heading.textContent).toContain("Sourced,");
    expect(heading.textContent).toContain("summarised,");
    expect(heading.textContent).toContain("accountable.");
  });

  it("describes the verified publisher sourcing approach", () => {
    const { container } = render(<HeroContent />);

    expect(container.textContent).toContain(
      "Whether you are tracking national headlines or regional updates",
    );
    expect(container.textContent).toContain(
      "pulling directly from verified publishers",
    );
    expect(container.textContent).toContain(
      "concise, attributed summary of what actually happened.",
    );
    expect(container.textContent).not.toMatch(/every single claim/i);
  });
});
