"use client";
import { useState } from "react";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import ThankYou from "@/components/waitlist/ThankYou";

export default function HeroContent() {
  const [submitted, setSubmitted] = useState(false);
  const [language, setLanguage] = useState("");

  function handleSuccess(lang: string) {
    setLanguage(lang);
    setSubmitted(true);
  }

  return (
    <>
      {submitted && <ThankYou language={language} />}
      <div>
        <p className="mb-5 flex items-center gap-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-red before:inline-block before:h-0.5 before:w-5 before:shrink-0 before:bg-red before:content-['']">
          Now in development
        </p>
        <h1 className="mb-5 font-serif text-[clamp(34px,4vw,52px)] font-semibold leading-[1.08] tracking-tight text-ink">
          India&apos;s news.
          <br />
          Sourced, summarised,
          <br />
          <span className="font-medium italic text-red">accountable.</span>
        </h1>
        <p className="mb-7 font-sans text-[17px] leading-[1.68] text-muted">
          You follow national news. But the project stalled in your state, the officer transferred in
          your district, the contractor who missed a deadline —{" "}
          <strong className="font-semibold text-ink">that news never reaches you.</strong> Saransh pulls
          directly from verified sources and gives you a concise, attributed summary of each story. No
          opinion. No algorithm. No forwarded videos.
        </p>
        <WaitlistForm onSuccess={handleSuccess} />
      </div>
    </>
  );
}
