import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { authOptions } from "@/lib/auth";

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
  process.env.SARANSH_INTERNAL_API_KEY = "internal-secret";
  global.fetch = fetchMock as typeof fetch;
});

afterEach(() => {
  fetchMock.mockReset();
  delete process.env.SARANSH_INTERNAL_API_KEY;
});

function respond(body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => body } as Response);
}

const jwt = (params: object) =>
  authOptions.callbacks!.jwt!(params as Parameters<NonNullable<typeof authOptions.callbacks>["jwt"] & object>[0]);

describe("authOptions.jwt", () => {
  it("syncs the Google profile and keeps the User id and onboarding state", async () => {
    respond({ id: "google-1", onboarded: false, created: true });

    const token = await jwt({
      token: { name: "Priya" },
      profile: {
        sub: "google-1",
        email: "p@example.com",
        name: "Priya",
        picture: "https://example.com/p.png",
      },
    });

    expect(token).toMatchObject({ userId: "google-1", onboarded: false, isNewUser: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/users\/sync$/);
    expect(JSON.parse(String(init?.body))).toEqual({
      id: "google-1",
      email: "p@example.com",
      name: "Priya",
      picture: "https://example.com/p.png",
    });
    expect((init?.headers as Record<string, string>)["X-API-Key"]).toBe("internal-secret");
  });

  it("re-reads onboarding from the API on update, ignoring client data", async () => {
    respond({ id: "google-1", onboarded: true });

    const token = await jwt({
      token: { userId: "google-1", onboarded: false },
      trigger: "update",
      session: { onboarded: false },
    });

    expect(token.onboarded).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/me$/);
    expect((init?.headers as Record<string, string>)["X-User-Id"]).toBe("google-1");
  });

  it("leaves the token alone on ordinary requests", async () => {
    const token = await jwt({ token: { userId: "google-1", onboarded: true } });

    expect(token).toEqual({ userId: "google-1", onboarded: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("authOptions.session", () => {
  it("exposes only the User's id and flags, never a credential", async () => {
    const session = await authOptions.callbacks!.session!({
      session: {
        user: { name: "Priya", email: "p@example.com", image: null },
        expires: "2026-11-18",
      },
      token: {
        userId: "google-1",
        onboarded: true,
        isNewUser: false,
        accessToken: "google-access-token",
        internalKey: "internal-secret",
      },
    } as never);

    expect(Object.keys(session.user ?? {}).sort()).toEqual(
      ["email", "id", "image", "isNewUser", "name", "onboarded"],
    );
    const exposed = JSON.stringify(session);
    expect(exposed).not.toContain("google-access-token");
    expect(exposed).not.toContain("internal-secret");
  });

  it("treats a token without a User as not signed up and not onboarded", async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: {}, expires: "2026-11-18" },
      token: {},
    } as never);

    expect(session.user).toMatchObject({ id: "", onboarded: false, isNewUser: false });
  });
});
