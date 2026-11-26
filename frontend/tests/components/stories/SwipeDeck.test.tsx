import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { axe } from "jest-axe";

import type { Story } from "@/constants/stories";

import SwipeDeck from "@/components/stories/SwipeDeck";

const WIDTH = 400;

function story(headline: string): Story {
  return {
    topic: "civic",
    headline,
    body: "Body copy.",
    source: "PTI",
    sourceUrl: `https://example.com/${headline.split(" ")[0].toLowerCase()}`,
  };
}

const stories = ["First story", "Second story", "Third story", "Fourth story"].map(story);

/** jsdom has no PointerEvent, so fireEvent would drop clientX and pointerId. */
beforeAll(() => {
  if (window.PointerEvent) return;
  class FakePointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? "touch";
    }
  }
  window.PointerEvent = FakePointerEvent as typeof PointerEvent;
});

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ left: 0, right: WIDTH, top: 0, bottom: 612, width: WIDTH, height: 612 } as DOMRect);
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete (window as Partial<Window>).matchMedia;
});

function renderDeck() {
  return render(<SwipeDeck stories={stories} title={<h1>Today&apos;s stories</h1>} />);
}

function card(offset: number): HTMLElement {
  return document.querySelector(`[data-deck-card="${offset}"]`) as HTMLElement;
}

function topHeadline() {
  return within(card(0)).getByRole("heading").textContent;
}

function press(x: number) {
  fireEvent.pointerDown(card(0), { pointerId: 1, clientX: x });
}

function moveTo(x: number) {
  fireEvent.pointerMove(card(0), { pointerId: 1, clientX: x });
}

function lift(x: number) {
  fireEvent.pointerUp(card(0), { pointerId: 1, clientX: x });
}

function swipe(from: number, to: number) {
  press(from);
  moveTo(to);
  lift(to);
}

function settle() {
  act(() => {
    jest.advanceTimersByTime(260);
  });
}

function next() {
  fireEvent.click(screen.getByRole("button", { name: "Next story" }));
}

function reduceMotion() {
  window.matchMedia = ((query: string) => ({ matches: query.includes("reduce") })) as typeof window.matchMedia;
}

describe("SwipeDeck swipes", () => {
  it("springs back from a drag shorter than 80px", () => {
    renderDeck();

    press(200);
    moveTo(121);
    expect(card(0).style.transform).toBe("translateX(-79px) rotate(-3.590909090909091deg)");
    lift(121);
    expect(card(0).style.transform).toBe("translateX(0px) rotate(0deg)");
    settle();

    expect(topHeadline()).toBe("First story");
  });

  it("flies the card off on a left swipe while the next one rises", () => {
    renderDeck();

    press(200);
    moveTo(120);
    expect(card(1).style.transform).toBe("translateY(7px) scale(0.97)");
    lift(120);
    expect(card(0).style.transform).toBe("translateX(-520px) rotate(-23.636363636363637deg)");
    expect(card(1).style.transform).toBe("translateY(0px) scale(1)");
    expect(card(0).style.transition).toBe("transform 260ms ease-out");
    settle();

    expect(topHeadline()).toBe("Second story");
    expect(screen.getByText("2 / 4")).toBeTruthy();
  });

  it("brings the previous card back on top on a right swipe while the current one sinks", () => {
    renderDeck();
    next();
    settle();

    press(100);
    moveTo(180);
    expect(card(-1).style.transform).toBe("translateX(-340px) rotate(-15.454545454545455deg)");
    expect(Number(card(-1).style.zIndex)).toBeGreaterThan(Number(card(0).style.zIndex));
    expect(card(0).style.transform).toBe("translateY(7px) scale(0.97)");
    lift(180);
    settle();

    expect(topHeadline()).toBe("First story");
  });

  it("does not move right on the first card", () => {
    renderDeck();

    press(100);
    moveTo(300);
    expect(card(0).style.transform).toBe("translateX(0px) rotate(0deg)");
    lift(300);
    settle();

    expect(topHeadline()).toBe("First story");
  });

  it("ignores drags that start within 24px of either card edge", () => {
    renderDeck();

    swipe(20, -200);
    swipe(WIDTH - 20, 100);
    settle();

    expect(topHeadline()).toBe("First story");
  });

  it("does not open the source link at the end of a drag", () => {
    renderDeck();
    press(200);
    moveTo(150);
    lift(150);

    const link = within(card(0)).getByRole("link");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe("SwipeDeck buttons", () => {
  it("run the same motion as the swipes", () => {
    renderDeck();

    next();
    expect(card(0).style.transform).toBe("translateX(-520px) rotate(-23.636363636363637deg)");
    settle();
    expect(topHeadline()).toBe("Second story");

    fireEvent.click(screen.getByRole("button", { name: "Previous story" }));
    expect(card(-1).style.transform).toBe("translateX(0px) rotate(0deg)");
    settle();
    expect(topHeadline()).toBe("First story");
  });

  it("disable Back on the first card and Next on the last", () => {
    renderDeck();
    const back = screen.getByRole("button", { name: "Previous story" });
    const forward = screen.getByRole("button", { name: "Next story" });

    expect(back.hasAttribute("disabled")).toBe(true);
    for (let i = 0; i < stories.length - 1; i++) {
      next();
      settle();
    }
    expect(topHeadline()).toBe("Fourth story");
    expect(forward.hasAttribute("disabled")).toBe(true);
  });
});

describe("SwipeDeck strip", () => {
  it("shows the heading, a politely announced counter and a bar that eases to its new width", () => {
    renderDeck();

    expect(screen.getByRole("heading", { level: 1, name: "Today's stories" })).toBeTruthy();
    expect(screen.getByText("1 / 4").getAttribute("aria-live")).toBe("polite");
    const bar = document.querySelector("[data-progress]") as HTMLElement;
    expect(bar.style.width).toBe("25%");
    expect(bar.className).toContain("duration-[240ms]");
    expect(bar.className).toContain("motion-reduce:transition-none");

    next();
    settle();
    expect(screen.getByText("2 / 4")).toBeTruthy();
    expect(bar.style.width).toBe("50%");
  });

  it("puts the swipe hint between the Back and Next circles", () => {
    renderDeck();

    const hint = screen.getByText("Swipe for the next story");
    const back = screen.getByRole("button", { name: "Previous story" });
    const forward = screen.getByRole("button", { name: "Next story" });
    expect(back.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hint.compareDocumentPosition(forward) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(forward.className).toContain("motion-safe:active:scale-[0.96]");
  });
});

describe("SwipeDeck stack", () => {
  it("shows only the current and adjacent cards, and hides the rest from assistive tech", () => {
    renderDeck();
    next();
    settle();

    expect(card(-1).style.visibility).toBe("hidden");
    expect(card(1).style.visibility).toBe("");
    expect(card(2).style.visibility).toBe("hidden");

    press(100);
    moveTo(150);
    expect(card(-1).style.visibility).toBe("");
    lift(150);
    settle();
    for (const offset of [-1, 1, 2]) {
      expect(card(offset).getAttribute("aria-hidden")).toBe("true");
      expect(card(offset).hasAttribute("inert")).toBe(true);
    }
    expect(card(0).hasAttribute("aria-hidden")).toBe(false);
    expect(card(0).className).toContain("touch-pan-y");
    expect(card(1).className).toContain("pointer-events-none");
  });

  it("swaps instantly with no tilt or fly under reduced motion", () => {
    reduceMotion();
    renderDeck();

    next();
    expect(topHeadline()).toBe("Second story");

    press(300);
    moveTo(150);
    expect(card(0).style.transform).toBe("translateX(0px) rotate(0deg)");
    lift(150);
    expect(topHeadline()).toBe("Third story");
  });

  it("renders nothing with no stories", () => {
    const { container } = render(<SwipeDeck stories={[]} title="Stories" />);
    expect(container.firstChild).toBeNull();
  });

  it("passes axe", async () => {
    jest.useRealTimers();
    const { container } = renderDeck();
    expect((await axe(container)).violations).toEqual([]);
  });
});
