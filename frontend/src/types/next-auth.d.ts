import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** True once the 90-day limit has passed; the reader must sign in again. */
    expired?: boolean;
    user: {
      id: string;
      onboarded: boolean;
      isNewUser: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    onboarded?: boolean;
    isNewUser?: boolean;
    /** Epoch ms of the Google sign-in; never changed by renewals. */
    signedInAt?: number;
    expired?: boolean;
  }
}
