import styles from "@/styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.logo}>Saransh</span>
        <a
          href="https://github.com/imsks/Saransh"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ghLink}
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}
