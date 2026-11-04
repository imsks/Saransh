import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";
import { signIn, signOut, useSession } from "next-auth/react";

import AccountButton from "@/components/auth/AccountButton";
import SignInButton from "@/components/auth/SignInButton";
import { forgetUser, track } from "@/lib/analytics";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));
jest.mock("@/lib/analytics", () => ({ track: jest.fn(), forgetUser: jest.fn() }));

const mockedSession = useSession as jest.MockedFunction<typeof useSession>;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe("SignInButton", () => {
  it("records where the click came from, then starts Google sign-in", () => {
    render(<SignInButton location="hero" className="btn" />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(track).toHaveBeenCalledWith("sign_in_clicked", { location: "hero" });
    expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/onboarding" });
  });
});

describe("AccountButton", () => {
  it("renders nothing while the session loads", () => {
    mockedSession.mockReturnValue({ data: null, status: "loading", update: jest.fn() } as never);
    const { container } = render(<AccountButton />);

    expect(container.firstChild).toBeNull();
  });

  it("offers sign-in to a Visitor", () => {
    mockedSession.mockReturnValue({ data: null, status: "unauthenticated", update: jest.fn() } as never);
    render(<AccountButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(track).toHaveBeenCalledWith("sign_in_clicked", { location: "navbar" });
  });

  it("shows who is signed in and signs out without leaving their analytics ID", () => {
    mockedSession.mockReturnValue({
      data: { user: { id: "google-1", name: "Priya Sharma", onboarded: true, isNewUser: false }, expires: "" },
      status: "authenticated",
      update: jest.fn(),
    } as never);
    render(<AccountButton />);

    expect(screen.getByLabelText("Priya Sharma")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(forgetUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("labels the avatar with the email when Google sends no name", () => {
    mockedSession.mockReturnValue({
      data: {
        user: { id: "google-1", email: "p@example.com", image: "https://example.com/p.png" },
        expires: "",
      },
      status: "authenticated",
      update: jest.fn(),
    } as never);
    render(<AccountButton />);

    expect(screen.getByRole("img", { name: "p@example.com" })).toBeTruthy();
  });
});
