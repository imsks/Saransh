import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (ORIGINAL_PUBLIC_API_URL === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = ORIGINAL_PUBLIC_API_URL;
  }
  jest.resetModules();
});

describe("API rewrites", () => {
  it.each([
    [undefined, "http://127.0.0.1:8001/api/v1/:path*"],
    ["http://localhost:8001/api/v1", "http://localhost:8001/api/v1/:path*"],
    ["http://saransh-api:8001/api/v1", "http://saransh-api:8001/api/v1/:path*"],
    ["https://api.example.com/api/v1/", "https://api.example.com/api/v1/:path*"],
    ["https://api.example.com/", "https://api.example.com/api/v1/:path*"],
  ])("uses the configured backend URL %s", async (apiUrl, destination) => {
    if (apiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = apiUrl;
    }
    jest.resetModules();
    const { default: config } = await import("../next.config.mjs");

    expect(await config.rewrites()).toEqual([
      { source: "/api/v1/:path*", destination },
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ]);
  });
});