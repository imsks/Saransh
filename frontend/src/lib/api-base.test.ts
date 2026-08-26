import { describe, expect, it } from "vitest";

import { getApiBaseUrl, getStoriesApiBaseUrl } from "./api-base";

describe("getApiBaseUrl", () => {
  it("returns the browser API base by default", () => {
    expect(getApiBaseUrl({ forServer: false })).toBe("http://localhost:8001/api/v1");
  });

  it("uses the Next rewrite base during SSR", () => {
    expect(getApiBaseUrl({ forServer: true })).toBe("http://127.0.0.1:3001/api/v1");
  });
});

describe("getStoriesApiBaseUrl", () => {
  it("returns the browser stories base by default", () => {
    expect(getStoriesApiBaseUrl({ forServer: false })).toBe(
      "http://localhost:8001/api/stories",
    );
  });

  it("uses the Next rewrite base during SSR", () => {
    expect(getStoriesApiBaseUrl({ forServer: true })).toBe(
      "http://127.0.0.1:3001/api/stories",
    );
  });
});
