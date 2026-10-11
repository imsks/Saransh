import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { Story, Topic } from "@/constants/stories";

import StoryCard from "@/components/stories/StoryCard";

import { analytics } from "@/lib/analytics";

// Spy on the real client: components call it at event time, so every capture lands here.
let capture: jest.SpiedFunction<typeof analytics.capture>;

beforeEach(() => {
  capture = jest.spyOn(analytics, "capture").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

function story(overrides: Partial<Story> = {}): Story {
  return {
    category: "National · Parliament",
    topic: "civic",
    credit: "PTI",
    headline: "Parliament passes data bill",
    body: "The Lok Sabha passed the bill by voice vote.",
    source: "PTI",
    sourceUrl: "https://example.com/canonical",
    ...overrides,
  };
}

describe("StoryCard", () => {
  const topicCases: [Topic, string][] = [
    ["politics", "Politics"],
    ["civic", "Civic"],
    ["education", "Education"],
    ["crime", "Crime"],
    ["business", "Business & Economy"],
    ["entertainment", "Entertainment"],
    ["sports", "Sports"],
  ];

  it("links the source credit to the citation link", () => {
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("href")).toBe("https://example.com/canonical");
    expect(link.textContent).toContain("PTI");
  });

  it("keeps the visible credit inside the accessible name", () => {
    // WCAG 2.5.3: a voice-control user says what they see on the badge.
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("aria-label")).toContain("PTI");
  });

  it("opens the citation link safely in a new tab", () => {
    render(<StoryCard story={story()} />);

    const link = screen.getByRole("link", { name: /source article/ });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the credit as plain text when there is no citation link", () => {
    render(
      <StoryCard
        story={story({ sourceUrl: undefined, credit: "PTI Photo" })}
      />,
    );

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("PTI")).toBeTruthy();
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
    const { container, rerender } = render(
      <StoryCard story={story({ official: true })} />,
    );
    expect(container.querySelector("[data-official-tick]")).not.toBeNull();

    rerender(<StoryCard story={story({ official: false })} />);
    expect(container.querySelector("[data-official-tick]")).toBeNull();
  });

  it.each(topicCases)(
    "renders the %s topic as a text label",
    (topic, label) => {
      render(<StoryCard story={story({ topic })} />);

      const topicLabel = screen.getByText(label);
      expect(topicLabel.tagName).toBe("SPAN");
      expect(topicLabel.className).toContain(`text-topic-${topic}`);
      expect(topicLabel.className).toContain("text-[12px]");
      expect(topicLabel.className).toContain("font-bold");
      expect(topicLabel.parentElement?.className).toContain("h-[26px]");
      expect(topicLabel.parentElement?.children[1]?.className).toContain(
        "w-[26px]",
      );
    },
  );

  it("uses the topic wash behind the image only when there is no photo", () => {
    const { container, rerender } = render(
      <StoryCard story={story({ topic: "education" })} />,
    );
    expect(container.querySelector("[data-topic]")?.className).toContain(
      "bg-topic-education-bg",
    );

    rerender(
      <StoryCard
        story={story({
          topic: "education",
          imageUrl: "https://example.com/cover.jpg",
        })}
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
    render(
      <StoryCard
        story={story({ imageUrl: "https://example.com/cover.jpg" })}
      />,
    );

    expect(screen.getByText("Parliament passes data bill")).toBeTruthy();
    expect(screen.getByText(/voice vote/)).toBeTruthy();
    const image = screen.getByAltText("Parliament passes data bill");
    expect(image.getAttribute("src")).toBe("https://example.com/cover.jpg");
  });

  it("keeps card dimensions fixed without scrolling or truncating story copy", () => {
    const { container } = render(
      <StoryCard story={story({ body: "Details ".repeat(500) })} />,
    );

    const card = container.querySelector("article");
    expect(card?.className).toContain("h-148");
    expect(card?.className).toContain("w-full");
    expect(screen.getByText(/Details/).parentElement?.className).not.toContain(
      "overflow-y-auto",
    );
    expect(screen.getByText(/Details/).parentElement?.className).not.toContain(
      "line-clamp",
    );
  });
});

describe("StoryCard Citation Links", () => {
  it("reports which Story's Citation Link was followed, and from where", () => {
    render(<StoryCard story={story()} />);

    fireEvent.click(screen.getByRole("link", { name: /source article/ }));
    fireEvent.click(screen.getByRole("link", { name: /^Read story/ }));

    expect(capture.mock.calls).toEqual([
      [
        "citation_link_clicked",
        { source: "PTI", headline: "Parliament passes data bill", link: "source_line" },
        { beacon: true },
      ],
      [
        "citation_link_clicked",
        { source: "PTI", headline: "Parliament passes data bill", link: "read_story" },
        { beacon: true },
      ],
    ]);
  });
});
