import { afterEach, describe, expect, it } from "@jest/globals";

import { getApiBaseUrl } from "@/lib/api-base";

const ORIGINAL_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (ORIGINAL_PUBLIC_API_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL_PUBLIC_API_URL;
  }
});

const REMOTE = "https://saransh-572964795629.asia-south1.run.app/api/v1";

describe("getApiBaseUrl", () => {
  it("returns the browser API base by default", () => {
    expect(getApiBaseUrl({ forServer: false })).toBe(
      "http://localhost:8001/api/v1",
    );
  });

  it("uses the Next rewrite base during SSR", () => {
    expect(getApiBaseUrl({ forServer: true })).toBe(
      "http://127.0.0.1:3001/api/v1",
    );
  });

  it("trims a trailing slash from the configured server API URL", () => {
    process.env.NEXT_PUBLIC_API_URL = `${REMOTE}/`;
    expect(getApiBaseUrl({ forServer: true })).toBe(REMOTE);
  });

  it("uses the container API directly on the server and same-origin in the browser", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://saransh-api:8001/api/v1";
    expect(getApiBaseUrl({ forServer: true })).toBe(
      "http://saransh-api:8001/api/v1",
    );
    expect(getApiBaseUrl({ forServer: false })).toBe("/api/v1");
  });

  it("calls the remote public API directly from the server", () => {
    process.env.NEXT_PUBLIC_API_URL = REMOTE;
    expect(getApiBaseUrl({ forServer: true })).toBe(REMOTE);
  });

  it("falls back to the Next rewrite on the server with no API URL", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(getApiBaseUrl({ forServer: true })).toBe(
      "http://127.0.0.1:3001/api/v1",
    );
  });

  it("keeps localhost browser calls on the public API URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8001/api/v1";
    expect(getApiBaseUrl({ forServer: false })).toBe(
      "http://127.0.0.1:8001/api/v1",
    );
  });

  it("uses the same-origin rewrite when the public API is remote", () => {
    process.env.NEXT_PUBLIC_API_URL = REMOTE;
    expect(getApiBaseUrl({ forServer: false })).toBe("/api/v1");
  });
});
