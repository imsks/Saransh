import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import OnboardingPage from "@/app/onboarding/page";
import { backend } from "@/lib/server-api";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/server-api", () => ({ backend: jest.fn() }));
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
jest.mock("@/components/layout", () => ({ Navbar: () => null, Footer: () => null }));
jest.mock("@/components/onboarding/OnboardingForm", () => ({
  __esModule: true,
  default: ({ missingFields }: { missingFields: string[] }) => (
    <p>{missingFields.join(", ")}</p>
  ),
}));

const mockedSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockedBackend = backend as jest.MockedFunction<typeof backend>;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("OnboardingPage", () => {
  it("sends a guest home", async () => {
    mockedSession.mockResolvedValueOnce(null);

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("sends an expired session home without calling the API", async () => {
    mockedSession.mockResolvedValueOnce({ expired: true, user: { id: "" } } as never);

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
    expect(mockedBackend).not.toHaveBeenCalled();
  });

  it("asks only what the shared User row is missing", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    mockedBackend.mockResolvedValueOnce({
      missing_fields: ["state", "topics"],
      onboarded: false,
    });

    render(await OnboardingPage());

    expect(mockedBackend).toHaveBeenCalledWith("/me", { userId: "google-1" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Set up your edition");
    expect(screen.getByText("state, topics")).toBeTruthy();
  });

  it("sends an already onboarded User to stories", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    mockedBackend.mockResolvedValueOnce({ onboarded: true });

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/stories");
  });
});
