"use client";

import { Avatar } from "@sutra_ui/ui";
import { signOut, useSession } from "next-auth/react";

import SignInButton from "@/components/auth/SignInButton";
import { navLinkClass } from "@/components/ui";
import { forgetUser } from "@/lib/analytics";
import { ROUTES } from "@/lib/routes";

export default function AccountButton() {
  const { data, status } = useSession();

  if (status === "loading") return null;
  if (!data || data.expired) {
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
