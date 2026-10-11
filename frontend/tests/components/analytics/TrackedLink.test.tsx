// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@sutra_ui/ui";

import TrackedLink from "@/components/analytics/TrackedLink";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import ThankYou from "@/components/waitlist/ThankYou";

const analytics = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ analytics }));

// jsdom cannot navigate; the click still runs every handler before this.
const stayOnPage = (e: Event) => e.preventDefault();
beforeEach(() => document.addEventListener("click", stayOnPage));

afterEach(() => {
  document.removeEventListener("click", stayOnPage);
  cleanup();
  vi.clearAllMocks();
});

describe("TrackedLink", () => {
  it("reports its event by beacon and still behaves as a link", () => {
    const onClick = vi.fn();
    render(
      <TrackedLink
        event="outbound_link_clicked"
        properties={{ destination: "github", placement: "navbar" }}
        href="https://github.com/imsks/Saransh"
        onClick={onClick}
      >
        GitHub
      </TrackedLink>,
    );

    const link = screen.getByRole("link", { name: "GitHub" });
    fireEvent.click(link);

    expect(link.getAttribute("href")).toBe("https://github.com/imsks/Saransh");
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith(
      "outbound_link_clicked",
      { destination: "github", placement: "navbar" },
      { beacon: true },
    );
  });

  it("reports a middle click, which opens a tab without a click event", () => {
    render(
      <TrackedLink
        event="outbound_link_clicked"
        properties={{ destination: "rajniti", placement: "footer" }}
        href="https://rajniti-app.vercel.app"
      >
        Rajniti
      </TrackedLink>,
    );

    fireEvent(
      screen.getByRole("link", { name: "Rajniti" }),
      new MouseEvent("auxclick", { bubbles: true, button: 1 }),
    );

    expect(analytics.capture).toHaveBeenCalledTimes(1);
  });
});

describe("outbound links", () => {
  function placementsFor(name: RegExp) {
    fireEvent.click(screen.getByRole("link", { name }));
    return analytics.capture.mock.calls.at(-1)?.[1];
  }

  it("tells the navbar GitHub link apart from the footer one", () => {
    render(
      <ThemeProvider>
        <Navbar />
        <Footer />
      </ThemeProvider>,
    );

    expect(placementsFor(/^GitHub$/)).toEqual({ destination: "github", placement: "navbar" });
    expect(placementsFor(/^Saransh$/)).toEqual({ destination: "github", placement: "footer" });
  });

  it("tracks both links on the thank-you screen", () => {
    render(<ThankYou />);

    expect(placementsFor(/FOLLOW THE BUILD/)).toEqual({
      destination: "github",
      placement: "thank_you",
    });
    expect(placementsFor(/EXPLORE RAJNITI/)).toEqual({
      destination: "rajniti",
      placement: "thank_you",
    });
  });
});
