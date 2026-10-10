export default function HeroContent() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-[clamp(34px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink">
        No noise. Just news. With proof.
        {/* Note: Check your Footer to match the exact Devanagari font class used there if needed */}
        <span className="block mt-3 text-[clamp(24px,2.5vw,32px)] text-muted font-normal">
          शोर नहीं। सिर्फ़ खबर। सबूत के साथ।
        </span>
      </h1>
      <p className="max-w-[44ch] border-l-2 border-red pl-4 font-sans text-[17px] leading-[1.68] text-muted">
        Saransh pulls from approved sources and gives you a short summary with the source named and linked.
      </p>
    </div>
  );
}