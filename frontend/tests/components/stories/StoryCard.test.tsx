import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";
import { axe } from "jest-axe";

import type { Story, Topic } from "@/constants/stories";

import StoryCard from "@/components/stories/StoryCard";

const NOW = new Date("2026-11-24T12:00:00Z");

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

function story(overrides: Partial<Story> = {}): Story {
  return {
    category: "National · Parliament",
    topic: "civic",
    imageUrl: "https://example.com/cover.jpg",
    headline: "Parliament passes data bill",
    body: "The Lok Sabha passed the bill by voice vote.",
    source: "PTI",
    sourceUrl: "https://example.com/canonical",
    createdAt: new Date(NOW.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function renderAtNow(s: Story) {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  return render(<StoryCard story={s} />);
}

function sourceLink() {
  return screen.getByRole("link", { name: "PTI, opens the original in a new tab" });
}

describe("StoryCard layout", () => {
  it("puts the parts in order: image, Topic row, headline, Summary, footer", () => {
    const { container } = renderAtNow(story());

    const parts = [
      screen.getByTestId("story-image"),
      screen.getByText("Civic"),
      screen.getByRole("heading", { name: "Parliament passes data bill" }),
      screen.getByText(/voice vote/),
      container.querySelector("footer")!,
    ];
    for (let i = 1; i < parts.length; i++) {
      expect(
        parts[i - 1].compareDocumentPosition(parts[i]) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("keeps a fixed height, sets text in Inter, and never clips or scrolls the copy", () => {
    const { container } = renderAtNow(story({ body: "Details ".repeat(60) }));

    const card = container.querySelector("article")!;
    expect(card.className).toContain("h-[612px]");
    expect(card.className).toContain("font-sans");
    expect(screen.getByRole("heading").className).toContain("font-sans");
    const summary = screen.getByText(/Details/);
    expect(summary.className).not.toMatch(/line-clamp|overflow-y-auto/);
  });

  it("keeps a 44px slot for Share and has no ⋮ menu", () => {
    const { container } = renderAtNow(story());

    expect(container.querySelector("[data-share-slot]")?.className).toContain("w-11");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has no Read story button", () => {
    renderAtNow(story());
    expect(screen.queryByText(/read story/i)).toBeNull();
  });

  it("passes axe", async () => {
    const { container } = render(<StoryCard story={story()} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("StoryCard Topic", () => {
  const topics: [Topic, string][] = [
    ["politics", "Politics"],
    ["civic", "Civic"],
    ["education", "Education"],
    ["crime", "Crime"],
    ["business", "Business & Economy"],
    ["entertainment", "Entertainment"],
    ["sports", "Sports"],
  ];

  it.each(topics)("shows %s as text in its colour, with no colour wash", (topic, name) => {
    const { container } = renderAtNow(story({ topic }));

    const label = screen.getByText(name);
    expect(label.className).toContain(`text-topic-${topic}`);
    expect(container.innerHTML).not.toContain(`bg-topic-${topic}-bg`);
  });
});

describe("StoryCard image", () => {
  it("shows the photo with a Photo: credit chip", () => {
    renderAtNow(story());

    const img = screen.getByTestId("story-image").querySelector("img")!;
    expect(img.getAttribute("src")).toBe("https://example.com/cover.jpg");
    expect(screen.getByText("Photo: PTI")).toBeTruthy();
  });

  it("swaps to a same-size placeholder with no chip when the photo fails", () => {
    renderAtNow(story());

    const frame = screen.getByTestId("story-image");
    act(() => {
      fireEvent.error(frame.querySelector("img")!);
    });

    expect(frame.querySelector("img")).toBeNull();
    expect(frame.querySelector("svg")).not.toBeNull();
    expect(frame.className).toContain("aspect-[1.91/1]");
    expect(screen.queryByText(/^Photo:/)).toBeNull();
  });

  it("shows the placeholder when there is no photo at all", () => {
    renderAtNow(story({ imageUrl: undefined }));

    expect(screen.getByTestId("story-image").querySelector("img")).toBeNull();
    expect(screen.queryByText(/^Photo:/)).toBeNull();
  });
});

describe("StoryCard time", () => {
  it("shows how long ago from createdAt, beside the source", () => {
    const { container } = renderAtNow(story());

    const time = screen.getByText("4 hours ago");
    expect(time.tagName).toBe("TIME");
    expect(container.querySelector("footer")?.contains(time)).toBe(true);
  });

  it("has no time on a sample card", () => {
    const { container } = renderAtNow(story({ createdAt: undefined }));

    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("footer")?.textContent).not.toContain("·");
  });
});

describe("StoryCard source line", () => {
  it("links to the original in a new tab, named for the source", () => {
    renderAtNow(story());

    const link = sourceLink();
    expect(link.getAttribute("href")).toBe("https://example.com/canonical");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.textContent).toContain("PTI");
    expect(link.className).toContain("min-h-11");
  });

  it("is plain text when there is no URL", () => {
    renderAtNow(story({ sourceUrl: undefined }));

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("PTI")).toBeTruthy();
  });

  it("is absent without a label, and never falls back to Saransh", () => {
    const { container } = renderAtNow(story({ source: undefined }));

    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("footer")?.textContent).toBe("4 hours ago");
    expect(container.textContent).not.toContain("Saransh");
  });

  it("shows the green tick for an Official Source only", () => {
    const { container, rerender } = renderAtNow(story({ official: true }));
    expect(sourceLink().querySelector("[data-official-tick]")).not.toBeNull();

    rerender(<StoryCard story={story({ official: false })} />);
    expect(container.querySelector("[data-official-tick]")).toBeNull();
  });
});
