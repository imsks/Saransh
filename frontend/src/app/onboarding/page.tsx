import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Footer, Navbar } from "@/components/layout";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { authOptions } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { backend, type Me } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Set up your account",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect(ROUTES.home);
  const me = await backend<Me>("/me", { userId: session.user.id });

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main className="mx-auto max-w-[496px] px-5 py-10">
        <h1 className="mb-2 font-serif text-[28px] font-semibold tracking-[-0.02em] text-ink">
          Set up your account
        </h1>
        <p className="mb-8 font-sans text-[14px] leading-[1.7] text-muted">
          A few questions, shared with Rajniti. We only ask what you have not
          answered yet.
        </p>
        <OnboardingForm questions={me.questions} />
      </main>
      <Footer />
    </div>
  );
}
