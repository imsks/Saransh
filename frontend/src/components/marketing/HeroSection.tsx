import Link from "next/link";

import SignInButton from "@/components/auth/SignInButton";
import HeroContent from "@/components/marketing/HeroContent";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui/buttonClasses";
import { ROUTES } from "@/lib/routes";

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1120px] px-8 pb-20 pt-[72px] max-[560px]:px-5">
      <div className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-16">
        <HeroContent />
        <div className="rounded-[2px] border-[1.5px] border-ink bg-card px-7 pb-[22px] pt-7 shadow-print dark:border-line">
          <span className="mb-[18px] block font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted">
            START READING
          </span>
          <div className="mb-2.5 flex flex-col gap-3">
            <SignInButton location="hero" className={`${primaryButtonClass} w-full`} />
            <Link href={ROUTES.stories} className={`${secondaryButtonClass} w-full`}>
              Read today&apos;s stories
            </Link>
          </div>
          <p className="font-mono text-[9.5px] leading-[1.65] tracking-[0.05em] text-muted">
            Signing in uses your Google name, email and photo.{" "}
            <Link href={ROUTES.privacy} className="text-ink underline underline-offset-2">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
