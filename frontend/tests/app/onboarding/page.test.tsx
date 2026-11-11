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
  default: ({
    displayName,
    rajnitiState,
  }: {
    displayName: string;
    rajnitiState: string | null;
  }) => (
    <p>
      {displayName} / {rajnitiState}
    </p>
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

  it("prefills the setup screen from the current User profile", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    mockedBackend.mockResolvedValueOnce({
      display_name: "Priya Sharma",
      rajniti_state: "Bihar",
      onboarded: false,
    });

    render(await OnboardingPage());

    expect(mockedBackend).toHaveBeenCalledWith("/me", { userId: "google-1" });
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Set up your edition");
    expect(screen.getByText("Priya Sharma / Bihar")).toBeTruthy();
  });

  it("sends an already onboarded User to stories", async () => {
    mockedSession.mockResolvedValueOnce({ user: { id: "google-1" } } as never);
    mockedBackend.mockResolvedValueOnce({ onboarded: true });

    await expect(OnboardingPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/stories");
  });
});
