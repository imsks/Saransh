"use client";
import { useState } from "react";
import styles from "@/styles/Hero.module.css";
import WaitlistForm from "@/components/Hero/WaitlistForm";
import StoryCarousel from "@/components/Hero/StoryCarousel";
import ThankYou from "@/components/ThankYou";

export default function Hero() {
  const [submitted, setSubmitted] = useState(false);
  const [language, setLanguage] = useState("");

  function handleSuccess(lang: string) {
    setLanguage(lang);
    setSubmitted(true);
  }

  return (
    <>
      {submitted && <ThankYou language={language} />}
      <section className={styles.section}>
        <div className={styles.grid}>
          <div>
            <p className={styles.kicker}>Now in development</p>
            <h1 className={styles.headline}>
              India&apos;s news.<br />
              Sourced, summarised,<br />
              <span className={styles.headlineRed}>accountable.</span>
            </h1>
            <p className={styles.body}>
              You follow national news. But the project stalled in your state, the officer transferred in your district, the contractor who missed a deadline —{" "}
              <strong className={styles.bodyBold}>that news never reaches you.</strong>{" "}
              Saransh pulls directly from verified sources and gives you a concise, attributed summary of each story. No opinion. No algorithm. No forwarded videos.
            </p>
            <WaitlistForm onSuccess={handleSuccess} />
          </div>
          <div>
            <StoryCarousel />
          </div>
        </div>
      </section>
    </>
  );
}
