import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { BackendError, backend } from "@/lib/server-api";

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
  process.env.SARANSH_INTERNAL_API_KEY = "internal-secret";
  global.fetch = fetchMock as typeof fetch;
});

afterEach(() => {
  fetchMock.mockReset();
  delete process.env.SARANSH_INTERNAL_API_KEY;
});

describe("backend", () => {
  it("calls FastAPI with the internal key on behalf of a User", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "u" }) } as Response);

    await expect(backend("/me", { userId: "google-1" })).resolves.toEqual({ id: "u" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/v1\/me$/);
    expect(init?.cache).toBe("no-store");
    expect(init?.headers).toEqual({
      "Content-Type": "application/json",
      "X-API-Key": "internal-secret",
      "X-User-Id": "google-1",
    });
  });

  it("raises the API's error detail", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: "state is required" }),
    } as Response);

    const error = await backend("/me/onboarding").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BackendError);
    expect(error).toMatchObject({ status: 422, detail: "state is required" });
  });

  it("falls back to the status text when the error body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new SyntaxError("not json");
      },
    } as unknown as Response);

    await expect(backend("/me")).rejects.toMatchObject({ status: 502, detail: "Bad Gateway" });
  });
});
