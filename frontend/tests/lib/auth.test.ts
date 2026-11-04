import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { SESSION_MAX_AGE_SECONDS, authOptions } from "@/lib/auth";

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
      token: { userId: "google-1", onboarded: false, signedInAt: Date.now() },
      trigger: "update",
      session: { onboarded: false },
    });

    expect(token.onboarded).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/me$/);
    expect((init?.headers as Record<string, string>)["X-User-Id"]).toBe("google-1");
  });

  it("leaves the token alone on ordinary requests", async () => {
    const signedInAt = Date.now();
    const token = await jwt({ token: { userId: "google-1", onboarded: true, signedInAt } });

    expect(token).toEqual({ userId: "google-1", onboarded: true, signedInAt });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("authOptions.jwt 90-day limit", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const LIMIT_MS = SESSION_MAX_AGE_SECONDS * 1000;
  const signedInAt = Date.parse("2026-01-01T00:00:00Z");

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const at = (elapsedMs: number) => jest.spyOn(Date, "now").mockReturnValue(signedInAt + elapsedMs);
  const signedIn = { userId: "google-1", onboarded: true, signedInAt };

  it("is 90 days", () => {
    expect(LIMIT_MS).toBe(90 * DAY_MS);
  });

  it("records when the reader signed in with Google", async () => {
    respond({ id: "google-1", onboarded: false, created: false });
    at(0);

    const token = await jwt({ token: {}, profile: { sub: "google-1", email: "p@example.com" } });

    expect(token.signedInAt).toBe(signedInAt);
  });

  it("keeps the session until the limit", async () => {
    at(LIMIT_MS - 1);

    expect(await jwt({ token: signedIn })).toEqual(signedIn);
  });

  it("ends the session at the limit, on an ordinary read", async () => {
    at(LIMIT_MS);

    expect(await jwt({ token: signedIn })).toEqual({ expired: true });
  });

  it("ends the session at the limit on an update, without calling the API", async () => {
    at(LIMIT_MS);

    expect(await jwt({ token: signedIn, trigger: "update" })).toEqual({ expired: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not let an update renew the deadline", async () => {
    respond({ id: "google-1", onboarded: true });
    at(LIMIT_MS - DAY_MS);

    const updated = await jwt({ token: signedIn, trigger: "update" });
    expect(updated.signedInAt).toBe(signedInAt);

    at(LIMIT_MS);
    expect(await jwt({ token: updated })).toEqual({ expired: true });
  });

  it("expires tokens issued before the sign-in time was recorded", async () => {
    expect(await jwt({ token: { userId: "google-1", onboarded: true } })).toEqual({ expired: true });
  });

  it("lets the reader sign in again after expiry", async () => {
    respond({ id: "google-1", onboarded: true, created: false });
    at(LIMIT_MS + DAY_MS);

    const token = await jwt({ token: { expired: true }, profile: { sub: "google-1", email: "p@example.com" } });

    expect(token).toMatchObject({ userId: "google-1", signedInAt: signedInAt + LIMIT_MS + DAY_MS });
    expect(token.expired).toBeUndefined();
  });
});

describe("authOptions.session", () => {
  it("marks an expired session so the client can sign out", async () => {
    const session = await authOptions.callbacks!.session!({
      session: { user: {}, expires: "2026-11-18" },
      token: { expired: true },
    } as never);

    expect(session).toMatchObject({ expired: true, user: { id: "" } });
  });

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
