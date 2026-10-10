// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import BottomCTA from "@/components/marketing/BottomCTA";

afterEach(cleanup);

describe("BottomCTA", () => {
  it("words human review as something still being built", () => {
    const { container } = render(<BottomCTA />);

    expect(container.textContent).toContain(
      "will be approved by a person before it goes live",
    );
    expect(container.textContent).toContain(
      "We are building the review step now.",
    );
    expect(container.textContent).not.toContain(
      "reviewed by a person before it goes live",
    );
  });

  it("still offers the waitlist call to action", () => {
    render(<BottomCTA />);

    expect(
      screen.getByRole("button", { name: "JOIN THE WAITLIST" }),
    ).toBeTruthy();
  });
});
