/**
 * @jest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { getServerSession } from "next-auth";

import { submitOnboarding } from "@/app/onboarding/actions";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockedSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

beforeEach(() => {
  global.fetch = fetchMock;
});

afterEach(() => {
  jest.clearAllMocks();
});

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status < 400,
    status,
    json: async () => body,
  } as Response);
}

describe("submitOnboarding", () => {
  it("refuses without a session", async () => {
    mockedSession.mockResolvedValueOnce(null);

    expect(await submitOnboarding({ state: "Bihar" })).toEqual({
      error: "Please sign in again.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves the answers as the signed-in User", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    respond(200, { onboarded: true });

    expect(await submitOnboarding({ state: "Bihar" })).toEqual({});
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/me\/onboarding$/);
    expect(init?.method).toBe("PUT");
    expect((init?.headers as Record<string, string>)["X-User-Id"]).toBe("google-1");
    expect(JSON.parse(String(init?.body))).toEqual({ answers: { state: "Bihar" } });
  });

  it("returns a validation message from the API", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    respond(422, { detail: "state is required" });

    expect(await submitOnboarding({})).toEqual({ error: "state is required" });
  });

  it("hides any other failure behind a generic message", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    respond(500, { detail: "database exploded" });

    expect(await submitOnboarding({})).toEqual({
      error: "Something went wrong. Please try again.",
    });
  });
});
