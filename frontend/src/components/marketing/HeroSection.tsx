"use client";

import { useState } from "react";

import HeroContent from "@/components/marketing/HeroContent";
import { Container } from "@/components/ui";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import ThankYou from "@/components/waitlist/ThankYou";

export default function Hero() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="pb-20 pt-[72px] max-[560px]:pb-14 max-[560px]:pt-12">
      {submitted && <ThankYou />}
      <Container className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-16">
        <HeroContent />
        <WaitlistForm onSuccess={() => setSubmitted(true)} />
      </Container>
    </section>
  );
}
