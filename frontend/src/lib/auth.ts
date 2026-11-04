import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { backend, type Me } from "@/lib/server-api";

/** A reader signs in with Google again 90 days after their last sign-in, however active. */
export const SESSION_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

/** Tokens issued before `signedInAt` existed have no deadline we can trust, so they expire. */
function isExpired(signedInAt: number | undefined) {
  return !signedInAt || Date.now() - signedInAt >= SESSION_MAX_AGE_SECONDS * 1000;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: { signIn: "/", error: "/" },
  callbacks: {
    async jwt({ token, profile, trigger }) {
      if (profile?.sub) {
        const me = await backend<Me & { created: boolean }>("/users/sync", {
          method: "POST",
          body: JSON.stringify({
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            picture: (profile as { picture?: string }).picture,
          }),
        });
        // Set only here, so renewing the cookie can never move the deadline.
        return {
          ...token,
          userId: me.id,
          onboarded: me.onboarded,
          isNewUser: me.created,
          signedInAt: Date.now(),
          expired: undefined,
        };
      }
      if (token.userId && isExpired(token.signedInAt)) return { expired: true };
      // Never trust a client-sent value: re-read the User after onboarding.
      if (trigger === "update" && token.userId) {
        const me = await backend<Me>("/me", { userId: token.userId });
        return { ...token, onboarded: me.onboarded };
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        expired: token.expired ?? false,
        user: {
          ...session.user,
          id: token.userId ?? "",
          onboarded: token.onboarded ?? false,
          isNewUser: token.isNewUser ?? false,
        },
      };
    },
  },
};
