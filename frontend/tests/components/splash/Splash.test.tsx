import { readFileSync } from "node:fs";
import path from "node:path";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { axe } from "jest-axe";

const mockUsePathname = jest.fn() as jest.Mock<string | null, []>;
jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import Splash, {
  SPLASH_FADE_MS,
  SPLASH_INTRO_MS,
} from "@/components/splash/Splash";
import SplashOffline from "@/components/splash/SplashOffline";
import { isSharedStoryPath } from "@/lib/routes";

const fetchSpy = jest.fn();

function setOnline(online: boolean) {
  jest.spyOn(window.navigator, "onLine", "get").mockReturnValue(online);
}

/** Pretend the CSS fade had already run `ms` when React hydrated. */
function hydrateAfter(ms: number) {
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    value: () => [{ animationName: "splash-out", currentTime: ms }],
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockUsePathname.mockReturnValue("/");
  setOnline(true);
  global.fetch = fetchSpy as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  delete (HTMLElement.prototype as { getAnimations?: unknown }).getAnimations;
  jest.useRealTimers();
  jest.restoreAllMocks();
  fetchSpy.mockReset();
});

describe("Splash", () => {
  describe("Splash plays on every app open", () => {
    it("shows the mark, wordmark, tagline and footer on a fresh load", () => {
      render(<Splash />);

      expect(screen.getByTestId("app-mark")).toBeTruthy();
      expect(screen.getByText("Saransh")).toBeTruthy();
      expect(screen.getByText("No noise. Just news. With proof.")).toBeTruthy();
      expect(screen.getByText("Open source · for India")).toBeTruthy();
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("plays the full intro, then fades out and hides without any network call", () => {
      render(<Splash />);

      // CSS fades it out once the intro ends, so it leaves even if JS never loads.
      const fade = screen.getByTestId("splash").style.animation;
      expect(fade).toContain("splash-out");
      expect(fade).toContain(`${SPLASH_INTRO_MS}ms`);

      advance(SPLASH_INTRO_MS + SPLASH_FADE_MS - 1);
      expect(screen.getByTestId("splash")).toBeTruthy();

      advance(1);
      expect(screen.queryByTestId("splash")).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("locks page scroll while it shows and releases it after", () => {
      render(<Splash />);
      expect(document.body.style.overflow).toBe("hidden");

      advance(SPLASH_INTRO_MS + SPLASH_FADE_MS);
      expect(document.body.style.overflow).toBe("");
    });

    it("never shows on a shared story link", () => {
      mockUsePathname.mockReturnValue("/s/abc123");
      render(<Splash />);

      expect(screen.queryByTestId("splash")).toBeNull();
    });

    it("does not come back after in-app navigation", () => {
      const { rerender } = render(<Splash />);
      advance(SPLASH_INTRO_MS + SPLASH_FADE_MS);

      mockUsePathname.mockReturnValue("/stories");
      rerender(<Splash />);
      expect(screen.queryByTestId("splash")).toBeNull();
    });
  });

  describe("Splash offline", () => {
    it("stops after the intro and shows the offline message", () => {
      setOnline(false);
      render(<Splash />);

      expect(screen.queryByRole("alert")).toBeNull();
      advance(SPLASH_INTRO_MS);

      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("You're offline");
      expect(alert.textContent).toContain(
        "Check your internet connection and try again.",
      );

      // The CSS fade is cancelled and the splash stays.
      advance(SPLASH_FADE_MS * 10);
      expect(screen.getByTestId("splash").style.animation).toBe("");
    });

    it("shows the offline message if the connection drops during the intro", () => {
      render(<Splash />);
      advance(SPLASH_INTRO_MS / 2);

      setOnline(false);
      advance(SPLASH_INTRO_MS / 2);
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    it("calls onRetry on Try again", () => {
      const onRetry = jest.fn();
      render(<SplashOffline onRetry={onRetry} />);

      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Splash timing after slow hydration", () => {
    it("times itself from the CSS fade, not from hydration", () => {
      hydrateAfter(1500);
      setOnline(false);
      render(<Splash />);

      advance(SPLASH_INTRO_MS - 1500);
      expect(screen.getByRole("alert")).toBeTruthy();
    });

    it("does not bring the splash back as offline once the intro has ended", () => {
      hydrateAfter(SPLASH_INTRO_MS + SPLASH_FADE_MS + 500);
      setOnline(false);
      render(<Splash />);

      advance(SPLASH_FADE_MS);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByTestId("splash")).toBeNull();
    });
  });

  describe("Splash in reduced motion", () => {
    const css = readFileSync(
      path.resolve(__dirname, "../../../src/app/globals.css"),
      "utf8",
    );

    it("turns off every splash animation under reduced motion", () => {
      const block = css.match(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.splash-icon,[^}]*\}/,
      )?.[0];
      expect(block).toBeDefined();
      for (const cls of [
        ".splash-icon",
        ".splash-lines path",
        ".splash-dot",
        ".splash-rise",
      ]) {
        expect(block).toContain(cls);
      }
      expect(block).toContain("animation: none");
    });

    it("has a Loading Saransh status shown only under reduced motion", () => {
      render(<Splash />);

      const status = screen.getByRole("status");
      expect(status.textContent).toBe("Loading Saransh");
      expect(status.className).toContain("sr-only");
      expect(status.className).toContain("hidden motion-reduce:block");
    });
  });

  describe("Splash accessibility", () => {
    it.each([
      ["intro", true],
      ["offline", false],
    ])("passes axe (%s)", async (_label, online) => {
      setOnline(online);
      const { container } = render(<Splash />);
      if (!online) advance(SPLASH_INTRO_MS);
      jest.useRealTimers();

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe("isSharedStoryPath", () => {
    it("matches only /s/{id}", () => {
      expect(isSharedStoryPath("/s/abc")).toBe(true);
      expect(isSharedStoryPath("/stories")).toBe(false);
      expect(isSharedStoryPath("/")).toBe(false);
      expect(isSharedStoryPath(null)).toBe(false);
    });
  });
});
