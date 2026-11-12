"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { BackendError, backend } from "@/lib/server-api";

/** Only the questions that were asked; the API ignores anything else. */
export interface OnboardingAnswers {
  name?: string;
  state?: string;
  topics?: string[];
  coming_soon_interests?: string[];
}

/** Saves onboarding preferences as the signed-in User. */
export async function submitOnboarding(
  answers: OnboardingAnswers,
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) return { error: "Please sign in again." };
  try {
    await backend("/me/onboarding", {
      method: "PUT",
      userId: session.user.id,
      body: JSON.stringify(answers),
    });
    return {};
  } catch (error) {
    if (error instanceof BackendError && error.status === 422) {
      return { error: error.detail };
    }
    return { error: "Something went wrong. Please try again." };
  }
}
