"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { BackendError, backend } from "@/lib/server-api";

export type Answers = Record<string, string | string[]>;

/** Saves onboarding answers as the signed-in User; Next.js checks the Origin of every action. */
export async function submitOnboarding(answers: Answers): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Please sign in again." };
  try {
    await backend("/me/onboarding", {
      method: "PUT",
      userId: session.user.id,
      body: JSON.stringify({ answers }),
    });
    return {};
  } catch (error) {
    if (error instanceof BackendError && error.status === 422) return { error: error.detail };
    return { error: "Something went wrong. Please try again." };
  }
}
