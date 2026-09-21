import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  const originalEnv = {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv.NEXT_PUBLIC_SITE_URL;
    process.env.NEXTAUTH_URL = originalEnv.NEXTAUTH_URL;
    process.env.VERCEL_URL = originalEnv.VERCEL_URL;
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://saransh.example.com/";
    expect(getSiteUrl()).toBe("https://saransh.example.com");
  });

  it("falls back to NEXTAUTH_URL", () => {
    process.env.NEXTAUTH_URL = "https://auth.example.com/";
    expect(getSiteUrl()).toBe("https://auth.example.com");
  });

  it("falls back to VERCEL_URL and adds https:// to a bare host", () => {
    process.env.VERCEL_URL = "saransh-app.vercel.app";
    expect(getSiteUrl()).toBe("https://saransh-app.vercel.app");
  });

  it("defaults to localhost:3001 when nothing is set", () => {
    expect(getSiteUrl()).toBe("http://localhost:3001");
  });

  it("strips trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://saransh.example.com///";
    expect(getSiteUrl()).toBe("https://saransh.example.com//");
  });
});
