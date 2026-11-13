import SignInButton from "@/components/auth/SignInButton";
import { Section, SectionHeader, buttonClass, cardClass, cx } from "@/components/ui";

export default function BottomCTA() {
  return (
    <Section aria-labelledby="bottom-cta-title">
      <div
        className={cx(
          cardClass({ variant: "elevated", padding: "none" }),
          "px-6 py-14 text-center min-[560px]:px-12",
        )}
      >
        <SectionHeader
          id="bottom-cta-title"
          align="center"
          title={
            <>
              News you can <em className="font-medium italic text-red">verify</em> in under five
              minutes.
            </>
          }
          lead={
            <>
              <p>
                Saransh is for people who want the story, not the take. Every summary is
                attributed, and will be approved by a person before it goes live. We are building
                the review step now.
              </p>
              <p>Sign in to start reading.</p>
            </>
          }
        />
        <SignInButton location="bottom_cta" className={cx(buttonClass(), "mt-8")} />
      </div>
    </Section>
  );
}
