"use client";

import { signIn } from "next-auth/react";

import { track } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";

interface SignInButtonProps {
  /** Where on the site the click came from, for the funnel. */
  location: "navbar" | "hero" | "bottom_cta";
  className: string;
  label?: string;
}

export default function SignInButton({
  location,
  className,
  label = "Sign in with Google",
}: SignInButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        track("sign_in_clicked", { location });
        void signIn("google", { callbackUrl: ROUTES.stories });
      }}
    >
      {label}
    </button>
  );
}
