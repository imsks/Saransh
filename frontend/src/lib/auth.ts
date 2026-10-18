import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { backend, type Me } from "@/lib/server-api";

export const authOptions: NextAuthOptions = {
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
        return { ...token, userId: me.id, onboarded: me.onboarded, isNewUser: me.created };
      }
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
