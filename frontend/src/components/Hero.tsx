import styles from "@/styles/Hero.module.css";
import HeroContent from "@/components/Hero/HeroContent";
import StoryCarousel from "@/components/Hero/StoryCarousel";

export default function Hero() {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <HeroContent />
        <div>
          <StoryCarousel />
        </div>
      </div>
    </section>
  );
}
