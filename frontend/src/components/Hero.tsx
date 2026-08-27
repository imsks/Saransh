import HeroContent from "@/components/Hero/HeroContent";
import StoryCarousel from "@/components/Hero/StoryCarousel";

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1120px] px-8 pb-20 pt-[72px] max-[560px]:px-5">
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-16">
        <HeroContent />
        <div>
          <StoryCarousel />
        </div>
      </div>
    </section>
  );
}
