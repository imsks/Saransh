import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { ThemeProvider } from "@sutra_ui/ui";

import StoriesPage from "@/app/stories/page";

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  global.fetch = fetchMock as typeof fetch;
  // The Navbar's theme switch reads the colour-scheme query.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  jest.restoreAllMocks();
});

async function renderPage() {
  render(<ThemeProvider>{await StoriesPage()}</ThemeProvider>);
}

describe("StoriesPage", () => {
  it("renders the latest published Stories as cards", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: "1",
          title_en: "Parliament passes data bill",
          summary_en: "The Lok Sabha passed the bill.",
          image_url: "https://example.com/cover.jpg",
          source_url: "https://example.com/article",
          source_label: "PTI",
          category: "politics",
          status: "published",
          created_at: "2026-10-18T00:00:00Z",
        },
      ],
    } as Response);
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Today's stories",
    );
    expect(
      screen.getByRole("heading", { name: "Parliament passes data bill" }),
    ).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/stories\?limit=50$/);
  });

  it("shows an empty state when the API fails", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    await renderPage();

    expect(screen.getByText("No stories yet. Check back soon.")).toBeTruthy();
  });

  it("shows an empty state when the API is unreachable", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await renderPage();

    expect(screen.getByText("No stories yet. Check back soon.")).toBeTruthy();
  });
});
