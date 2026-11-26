"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { BusyButton } from "@/components/ui";
import { track } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";

interface SignInButtonProps {
  location: "navbar" | "hero" | "bottom_cta";
  className: string;
  label?: string;
}

/** Busy until the browser leaves for Google. */
export default function SignInButton({
  location,
  className,
  label = "Continue with Google",
}: SignInButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <BusyButton
      type="button"
      busy={loading}
      className={className}
      onClick={() => {
        setLoading(true);
        track("sign_in_clicked", { location });
        void signIn("google", { callbackUrl: ROUTES.onboarding });
      }}
    >
      {label}
    </BusyButton>
  );
}
