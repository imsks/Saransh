// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/routes";

import Footer from "@/components/layout/Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("links to the privacy page through the shared route constant", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Privacy" });
    expect(link.getAttribute("href")).toBe(ROUTES.privacy);
  });

  it("renders the new Hindi tagline", () => {
    render(<Footer />);

    expect(screen.getByText("शोर नहीं। सिर्फ़ खबर। सबूत के साथ।")).toBeTruthy();
  });
});
