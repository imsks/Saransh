// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Story } from "@/constants/stories";

import StoryCard from "./StoryCard";

afterEach(cleanup);

function story(overrides: Partial<Story> = {}): Story {
  return {
    category: "National · Parliament",
    time: "2 hrs ago",
    topic: "civic",
    credit: "PTI",
    headline: "Parliament passes data bill",
    body: "The Lok Sabha passed the bill by voice vote.",
    source: "PTI · Verified",
    sourceUrl: "https://example.com/canonical",
    ...overrides,
  };
}

describe("StoryCard", () => {
  it("links the source credit to the citation link", () => {
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("href")).toBe("https://example.com/canonical");
    expect(link.textContent).toContain("PTI · Verified");
  });

  it("keeps the visible credit inside the accessible name", () => {
    // WCAG 2.5.3: a voice-control user says what they see on the badge.
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("aria-label")).toContain("PTI · Verified");
  });

  it("opens the citation link safely in a new tab", () => {
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the credit as plain text when there is no citation link", () => {
    render(<StoryCard story={story({ sourceUrl: undefined })} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("PTI · Verified")).toBeTruthy();
  });

  it("offers Read story only when there is an article to read", () => {
    const { rerender } = render(<StoryCard story={story()} />);

    const cta = screen.getByRole("link", { name: /^Read story/ });
    expect(cta.getAttribute("href")).toBe("https://example.com/canonical");
    expect(cta.textContent).toBe("Read story");

    rerender(<StoryCard story={story({ sourceUrl: undefined })} />);
    expect(screen.queryByRole("link", { name: /^Read story/ })).toBeNull();
  });

  it("shows the tick for official sources only", () => {
    const { container, rerender } = render(<StoryCard story={story({ official: true })} />);
    expect(container.querySelector("[data-official-tick]")).not.toBeNull();

    rerender(<StoryCard story={story({ official: false })} />);
    expect(container.querySelector("[data-official-tick]")).toBeNull();
  });

  it("colours the time line by topic and nothing else", () => {
    render(<StoryCard story={story({ topic: "transport" })} />);

    expect(screen.getByText("2 hrs ago").className).toContain("text-topic-transport");
    expect(screen.getByText("Parliament passes data bill").className).not.toContain("topic");
    expect(screen.getByRole("link", { name: /^Read story/ }).className).not.toContain("topic");
  });

  it("uses the topic wash behind the image only when there is no photo", () => {
    const { container, rerender } = render(<StoryCard story={story({ topic: "edu" })} />);
    expect(container.querySelector("[data-topic]")?.className).toContain("bg-topic-edu-bg");

    rerender(
      <StoryCard story={story({ topic: "edu", imageUrl: "https://example.com/cover.jpg" })} />,
    );
    expect(container.querySelector("[data-topic]")?.className).not.toContain("bg-topic-edu-bg");
  });

  it("still renders headline, body and cover image alongside the link", () => {
    render(<StoryCard story={story({ imageUrl: "https://example.com/cover.jpg" })} />);

    expect(screen.getByText("Parliament passes data bill")).toBeTruthy();
    expect(screen.getByText(/voice vote/)).toBeTruthy();
    const image = screen.getByAltText("Parliament passes data bill");
    expect(image.getAttribute("src")).toBe("https://example.com/cover.jpg");
  });
});
