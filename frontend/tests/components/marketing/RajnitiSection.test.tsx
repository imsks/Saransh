// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import RajnitiSection from "@/components/marketing/RajnitiSection";

afterEach(cleanup);

describe("RajnitiSection", () => {
  it("presents the Rajniti link as planned, not live", () => {
    const { container } = render(<RajnitiSection />);

    expect(screen.getByText("PLANNED · V2")).toBeTruthy();
    expect(container.textContent).not.toContain("LINKED");
    expect(container.textContent).not.toContain("Barabanki");
    expect(container.textContent).not.toContain("MLA");
    expect(container.textContent).not.toContain("Deva Road");
  });

  it("uses the placeholder illustration instead of a real representative", () => {
    render(<RajnitiSection />);

    expect(screen.getByText("Minister · [Name]")).toBeTruthy();
    expect(screen.getByText("Illustration")).toBeTruthy();
  });

  it("keeps the Explore Rajniti link", () => {
    render(<RajnitiSection />);

    const link = screen.getByRole("link", { name: "Explore Rajniti" });
    expect(link.getAttribute("href")).toBe("https://rajniti-app.vercel.app");
  });
});
