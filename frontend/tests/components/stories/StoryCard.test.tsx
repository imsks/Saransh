// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { Story, Topic } from "@/constants/stories";

import StoryCard from "@/components/stories/StoryCard";

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

  it("always shows Read story, but only links it when there is an article", () => {
    const { rerender } = render(<StoryCard story={story()} />);

    const cta = screen.getByRole("link", { name: /^Read story/ });
    expect(cta.getAttribute("href")).toBe("https://example.com/canonical");
    expect(cta.textContent).toBe("Read story");

    rerender(<StoryCard story={story({ sourceUrl: undefined })} />);
    expect(screen.queryByRole("link", { name: /^Read story/ })).toBeNull();
    expect(screen.getByText("Read story").tagName).toBe("SPAN");
  });

  it("shows the tick for official sources only", () => {
    const { container, rerender } = render(<StoryCard story={story({ official: true })} />);
    expect(container.querySelector("[data-official-tick]")).not.toBeNull();

    rerender(<StoryCard story={story({ official: false })} />);
    expect(container.querySelector("[data-official-tick]")).toBeNull();
  });

  it.each([
    ["politics", "Politics"],
    ["civic", "Civic"],
    ["education", "Education"],
    ["crime", "Crime"],
    ["business", "Business & Economy"],
    ["entertainment", "Entertainment"],
    ["sports", "Sports"],
  ] as const)("renders the %s topic as a text label", (topic, label) => {
    render(<StoryCard story={story({ topic })} />);

    const topicLabel = screen.getByText(label);
    expect(topicLabel.tagName).toBe("SPAN");
    expect(topicLabel.className).toContain(`text-topic-${topic}`);
    expect(topicLabel.className).toContain("text-[12px]");
    expect(topicLabel.className).toContain("font-bold");
    expect(topicLabel.parentElement?.className).toContain("h-[26px]");
    expect(topicLabel.parentElement?.children[1]?.className).toContain("w-[26px]");

    const time = screen.getByText("2 hrs ago");
    expect(time.className).toContain("text-muted");
    expect(time.className).toContain("font-medium");
    expect(time.className).not.toContain(`text-topic-${topic}`);
  });

  it("uses the topic wash behind the image only when there is no photo", () => {
    const { container, rerender } = render(<StoryCard story={story({ topic: "education" })} />);
    expect(container.querySelector("[data-topic]")?.className).toContain("bg-topic-education-bg");

    rerender(
      <StoryCard
        story={story({ topic: "education", imageUrl: "https://example.com/cover.jpg" })}
      />,
    );
    expect(container.querySelector("[data-topic]")?.className).not.toContain(
      "bg-topic-education-bg",
    );
  });

  it("renders the wash for every v1.3 topic", () => {
    const topics: Topic[] = [
      "politics",
      "civic",
      "education",
      "crime",
      "business",
      "entertainment",
      "sports",
    ];

    for (const topic of topics) {
      const { container } = render(<StoryCard story={story({ topic })} />);
      const wash = container.querySelector("[data-topic]");

      expect(wash?.getAttribute("data-topic")).toBe(topic);
      expect(wash?.className).toContain(`bg-topic-${topic}-bg`);
      cleanup();
    }
  });

  it("still renders headline, body and cover image alongside the link", () => {
    render(<StoryCard story={story({ imageUrl: "https://example.com/cover.jpg" })} />);

    expect(screen.getByText("Parliament passes data bill")).toBeTruthy();
    expect(screen.getByText(/voice vote/)).toBeTruthy();
    const image = screen.getByAltText("Parliament passes data bill");
    expect(image.getAttribute("src")).toBe("https://example.com/cover.jpg");
  });
});
