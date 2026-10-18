"use client";

import { Avatar } from "@sutra_ui/ui";
import { signOut, useSession } from "next-auth/react";

import SignInButton from "@/components/auth/SignInButton";
import { forgetUser } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";

const navLinkClass =
  "inline-flex min-h-11 items-center font-mono text-[11.5px] font-normal uppercase tracking-[0.06em] text-muted transition-colors hover:text-ink";

/** Sign in when signed out; who is signed in, and sign out, when signed in. */
export default function AccountButton() {
  const { data, status } = useSession();

  if (status === "loading") return null;
  if (!data) {
    return <SignInButton location="navbar" className={navLinkClass} label="Sign in" />;
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar
        src={data.user.image ?? undefined}
        name={data.user.name ?? data.user.email ?? undefined}
        size="sm"
      />
      <button
        type="button"
        className={navLinkClass}
        onClick={() => {
          forgetUser();
          void signOut({ callbackUrl: ROUTES.home });
        }}
      >
        Sign out
      </button>
    </div>
  );
}
