import styles from "@/styles/Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <div className={styles.wordmarkRow}>
            <span className={styles.wordmarkEn}>Saransh</span>
            <span className={styles.wordmarkHi}>सारांश</span>
          </div>
          <p className={styles.tagline}>आपके ज़िले की खबर, 60 शब्दों में, सबूत के साथ।</p>
        </div>
        <div className={styles.right}>
          <a href="https://github.com/imsks/Saransh" target="_blank" rel="noopener noreferrer" className={styles.link}>
            GitHub ↗
          </a>
          <a href="https://rajniti-app.vercel.app" target="_blank" rel="noopener noreferrer" className={styles.link}>
            Rajniti ↗
          </a>
          <div className={styles.attribution}>
            <div>Built with ❤️ for the AI and news community</div>
            <div>
              Follow the build →{" "}
              <a href="https://github.com/imsks/Saransh" target="_blank" rel="noopener noreferrer" className={styles.attrLink}>
                Saransh
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
