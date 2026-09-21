import { afterEach, describe, expect, it } from "vitest";

import { getApiBaseUrl } from "./api-base";

const ORIGINAL_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (ORIGINAL_PUBLIC_API_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL_PUBLIC_API_URL;
  }
});

describe("getApiBaseUrl", () => {
  it("returns the browser API base by default", () => {
    expect(getApiBaseUrl({ forServer: false })).toBe("http://localhost:8001/api/v1");
  });

  it("uses the Next rewrite base during SSR", () => {
    expect(getApiBaseUrl({ forServer: true })).toBe("http://127.0.0.1:3001/api/v1");
  });

  it("keeps localhost browser calls on the public API URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8001/api/v1";
    expect(getApiBaseUrl({ forServer: false })).toBe("http://127.0.0.1:8001/api/v1");
  });

  it("uses the same-origin rewrite when the public API is remote", () => {
    process.env.NEXT_PUBLIC_API_URL =
      "https://saransh-572964795629.asia-south1.run.app/api/v1";
    expect(getApiBaseUrl({ forServer: false })).toBe("/api/v1");
  });
});
