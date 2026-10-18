"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

import { identify } from "@/lib/analytics";

function IdentifyUser() {
  const { data } = useSession();
  const userId = data?.user.id;
  const newUser = data?.user.isNewUser ?? false;

  useEffect(() => {
    if (userId) identify(userId, newUser);
  }, [userId, newUser]);

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
