"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

import { forgetUser, identify } from "@/lib/analytics";

function IdentifyUser() {
  const { data } = useSession();
  const userId = data?.user.id;
  const newUser = data?.user.isNewUser ?? false;
  const expired = data?.expired ?? false;

  useEffect(() => {
    if (userId) identify(userId, newUser);
  }, [userId, newUser]);

  // The 90-day limit has passed: clear the cookie and the analytics identity.
  useEffect(() => {
    if (!expired) return;
    forgetUser();
    void signOut({ redirect: false });
  }, [expired]);

  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <IdentifyUser />
      {children}
    </SessionProvider>
  );
}
