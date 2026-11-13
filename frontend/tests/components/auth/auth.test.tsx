import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "@jest/globals";
import { signIn, signOut, useSession } from "next-auth/react";

import AccountButton from "@/components/auth/AccountButton";
import SignInButton from "@/components/auth/SignInButton";
import AuthProvider from "@/components/providers/AuthProvider";
import { forgetUser, identify, track } from "@/lib/analytics";

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));
jest.mock("@/lib/analytics", () => ({ track: jest.fn(), forgetUser: jest.fn(), identify: jest.fn() }));

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

  it("treats an expired session as signed out", () => {
    mockedSession.mockReturnValue({
      data: { expired: true, user: { id: "" }, expires: "" },
      status: "authenticated",
      update: jest.fn(),
    } as never);
    render(<AccountButton />);

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
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

describe("AuthProvider", () => {
  it("signs out an expired session and forgets the analytics ID, without identifying it", () => {
    mockedSession.mockReturnValue({
      data: { expired: true, user: { id: "", onboarded: false, isNewUser: false }, expires: "" },
      status: "authenticated",
      update: jest.fn(),
    } as never);
    render(<AuthProvider>content</AuthProvider>);

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(forgetUser).toHaveBeenCalledTimes(1);
    expect(identify).not.toHaveBeenCalled();
  });

  it("identifies a live session and leaves it signed in", () => {
    mockedSession.mockReturnValue({
      data: { user: { id: "google-1", onboarded: true, isNewUser: false }, expires: "" },
      status: "authenticated",
      update: jest.fn(),
    } as never);
    render(<AuthProvider>content</AuthProvider>);

    expect(identify).toHaveBeenCalledWith("google-1", false);
    expect(signOut).not.toHaveBeenCalled();
  });
});
