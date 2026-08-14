"use client";
import { useEffect } from "react";
import styles from "@/styles/ThankYou.module.css";

export default function ThankYou({ language }: { language: string }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.checkCircle}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className={styles.headline}>
        You&apos;re on the list.<br />
        <span className={styles.headlineItalic}>We&apos;ll be in touch.</span>
      </h2>
      <p className={styles.body}>
        We&apos;ll reach out when Saransh is ready for your region. No spam — one email when we launch.
      </p>
      <p className={styles.langLine}>
        We&apos;ll contact you in <span className={styles.langName}>{language}</span>.
      </p>
      <div className={styles.actions}>
        <a
          href="https://github.com/imsks/Saransh"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnPrimary}
        >
          Follow the build on GitHub ↗
        </a>
        <a
          href="https://rajniti-app.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnSecondary}
        >
          Explore Rajniti ↗
        </a>
      </div>
      <p className={styles.stamp}>
        Saransh सारांश — आपके ज़िले की खबर, 60 शब्दों में, सबूत के साथ।
      </p>
    </div>
  );
}
