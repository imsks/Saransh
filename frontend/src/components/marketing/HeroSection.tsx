"use client";

import { useState } from "react";

import HeroContent from "@/components/marketing/HeroContent";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import ThankYou from "@/components/waitlist/ThankYou";

export default function Hero() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="mx-auto max-w-[1120px] px-8 pb-20 pt-[72px] max-[560px]:px-5">
      {submitted && <ThankYou />}
      <div className="grid grid-cols-1 items-center gap-10 min-[860px]:grid-cols-2 min-[860px]:gap-[72px]">
        <HeroContent />
        <WaitlistForm onSuccess={() => setSubmitted(true)} />
      </div>
    </section>
  );
}
