// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/routes";

import Footer from "./Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("links to the privacy page through the shared route constant", () => {
    render(<Footer />);

    const link = screen.getByRole("link", { name: "Privacy" });
    expect(link.getAttribute("href")).toBe(ROUTES.privacy);
  });
});
