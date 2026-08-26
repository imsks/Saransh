import styles from "@/styles/RajnitiSection.module.css";

export default function RajnitiSection() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div>
            <span className={styles.kicker}>Civic accountability</span>
            <h2 className={styles.headline}>
              When a story mentions a politician&apos;s promise, we link it to their record.
            </h2>
            <p className={styles.body}>
              Saransh is built alongside <strong>Rajniti</strong> — an open database of elected representatives, their promises, and their tracked outcomes. When a story touches a government project or official announcement, it cross-links to the representative responsible.
            </p>
            <p className={styles.body}>
              You&apos;ll see, inline in the story card, what was promised, when, and what the current status is. One tap goes to their full public profile on Rajniti.
            </p>
            <a href="https://rajniti-app.vercel.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
              Explore Rajniti ↗
            </a>
          </div>
          <div>
            <div className={styles.chip}>
              <div className={styles.chipHeaderRow}>
                <span className={styles.chipHeaderLabel}>Rajniti · Your representative</span>
                <span className={styles.chipHeaderLabel}>Linked</span>
              </div>
              <p className={styles.chipName}>MLA · Barabanki Sadar</p>
              <p className={styles.chipPromise}>
                Promise (2024): &quot;Deva Road widening complete by March 2026&quot; · Status:{" "}
                <span className={styles.chipDelayed}>Delayed</span>,{" "}
                <span className={styles.chipDelayed}>60% complete</span>
              </p>
              <a href="https://rajniti-app.vercel.app" target="_blank" rel="noopener noreferrer" className={styles.chipLink}>
                View profile on Rajniti ↗
              </a>
            </div>
            <div className={styles.contextNote}>
              This chip appears inline when a story mentions a project or scheme linked to a tracked representative. The connection is drawn from Rajniti&apos;s public dataset — not inferred by the model.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
