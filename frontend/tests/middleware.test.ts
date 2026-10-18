/**
 * @jest-environment node
 */
import { describe, expect, it } from "@jest/globals";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

import { middleware } from "@/middleware";

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

const mockedToken = getToken as jest.MockedFunction<typeof getToken>;

async function visit(path: string, token: object | null) {
  mockedToken.mockResolvedValueOnce(token as never);
  const response = await middleware(new NextRequest(`https://saransh.test${path}`));
  return response.headers.get("location");
}

describe("middleware", () => {
  it("lets guests read stories", async () => {
    expect(await visit("/stories", null)).toBeNull();
  });

  it("sends a signed-in User with unanswered questions to onboarding", async () => {
    expect(await visit("/stories", { onboarded: false })).toBe(
      "https://saransh.test/onboarding",
    );
  });

  it("lets an onboarded User read stories", async () => {
    expect(await visit("/stories", { onboarded: true })).toBeNull();
  });

  it("keeps guests out of onboarding", async () => {
    expect(await visit("/onboarding", null)).toBe("https://saransh.test/");
  });

  it("never shows onboarding again once it is done", async () => {
    expect(await visit("/onboarding", { onboarded: true })).toBe(
      "https://saransh.test/stories",
    );
  });

  it("shows onboarding to a User who still has questions", async () => {
    expect(await visit("/onboarding", { onboarded: false })).toBeNull();
  });
});
