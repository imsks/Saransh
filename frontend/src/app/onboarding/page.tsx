import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/layout";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { cx, pageTitleClass } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { backend, type Me } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Set up your edition",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.expired || !session.user.id) redirect(ROUTES.home);
  const me = await backend<Me>("/me", { userId: session.user.id });
  if (me.onboarded) redirect(ROUTES.stories);

  return (
    <PageShell className="mx-auto max-w-[496px] px-5 py-10">
      <h1 className={cx(pageTitleClass, "mb-2")}>Set up your edition</h1>
      <p className="mb-8 font-sans text-[14px] leading-[1.7] text-muted">
        A few details for your edition.
      </p>
      <OnboardingForm missingFields={me.missing_fields} />
    </PageShell>
  );
}
