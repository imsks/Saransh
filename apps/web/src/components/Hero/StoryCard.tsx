import styles from "@/styles/StoryCard.module.css";
import { Story } from "@/constants/stories";

const imageClassMap = {
  national: styles.imageNational,
  road: styles.imageRoad,
  civic: styles.imageCivic,
};

export default function StoryCard({ story }: { story: Story }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.metaRow}>
        <span className={styles.category}>{story.category}</span>
        <span className={styles.timestamp}>{story.time}</span>
      </div>
      <div className={`${styles.imagePlaceholder} ${imageClassMap[story.imageVariant]}`}>
        <span className={styles.imageCredit}>{story.credit}</span>
      </div>
      <p className={styles.headline}>{story.headline}</p>
      <p className={styles.body}>{story.body}</p>
      <div className={styles.footerRow}>
        <div className={styles.sourceBadge}>
          <span className={styles.sourceDot} />
          <span className={styles.sourceLabel}>{story.source} ↗</span>
        </div>
        <div className={styles.menuDots} aria-hidden="true">
          <span className={styles.menuDot} />
          <span className={styles.menuDot} />
          <span className={styles.menuDot} />
        </div>
      </div>
    </div>
  );
}
