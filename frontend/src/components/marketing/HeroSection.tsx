import Link from "next/link";

import SignInButton from "@/components/auth/SignInButton";
import HeroContent from "@/components/marketing/HeroContent";
import { Container, buttonClass, cardClass, cx, eyebrowClass } from "@/components/ui";
import { ROUTES } from "@/lib/routes";

export default function Hero() {
  return (
    <section className="pb-20 pt-[72px] max-[560px]:pb-14 max-[560px]:pt-12">
      <Container className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-16">
        <HeroContent />
        <div className={cardClass({ variant: "elevated", padding: "lg" })}>
          <span className={cx(eyebrowClass(), "mb-[18px]")}>START READING</span>
          <div className="mb-2.5 flex flex-col gap-3">
            <SignInButton location="hero" className={buttonClass({ fullWidth: true })} />
            <Link
              href={ROUTES.stories}
              className={buttonClass({ variant: "secondary", fullWidth: true })}
            >
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
      </Container>
    </section>
  );
}
