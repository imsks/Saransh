import styles from "@/styles/BottomCTA.module.css";

export default function BottomCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.headline}>
          News you can <span className={styles.headlineRed}>verify</span> in under five minutes.
        </h2>
        <p className={styles.body}>
          Verified sources. Human-reviewed summaries. No algorithm. No opinion. Be the first to know when Saransh is ready.
        </p>
        <a href="#waitlist" className={styles.btn}>
          Join the waitlist ↗
        </a>
      </div>
    </section>
  );
}
