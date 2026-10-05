import type { Metadata } from "next";

import { Footer, Navbar } from "@/components/layout";
import { EXTERNAL } from "@/lib/routes";
import { buildDefaultOg, buildDefaultTwitter, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

const title = "Privacy";
const description =
  "What Saransh collects, what it does with it, and how to ask for your data to be deleted.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/privacy` },
  openGraph: {
    ...buildDefaultOg(),
    url: `${getSiteUrl()}/privacy`,
    title: `${title} | ${SITE_NAME}`,
    description,
  },
  twitter: { ...buildDefaultTwitter(), title: `${title} | ${SITE_NAME}`, description },
};

const headingClass =
  "mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink";
const paragraphClass = "font-sans text-[14px] leading-[1.75] text-muted";
const linkClass = "font-semibold text-ink underline underline-offset-2";

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7">
      <h2 className={headingClass}>{heading}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main>
        <div className="mx-auto max-w-[720px] px-8 py-16 max-[560px]:px-5 max-[560px]:py-12">
          <h1 className="font-serif text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink max-[560px]:text-[28px]">
            Privacy
          </h1>
          <p className="mt-4 font-sans text-[14px] leading-[1.75] text-muted">
            Saransh is pre-launch, and this page says plainly what the site collects and what
            happens to it. If something here is unclear, that is a bug — tell us and we will
            rewrite it.
          </p>

          <div className="mt-8">
            <Section heading="Joining the waitlist">
              <p className={paragraphClass}>
                The waitlist form stores two things: the name you type and the email address you
                type. Nothing else from the form is kept.
              </p>
              <p className={paragraphClass}>
                They are used for exactly what the form promises — one email when Saransh launches.
                No newsletter, no drip sequence, and the list is never sold, rented, or shared with
                anyone else. Signing up twice with the same email is still one signup, not two.
              </p>
            </Section>

            <Section heading="Anonymous usage analytics">
              <p className={paragraphClass}>
                The site measures how it is used so we know which parts of the page are working.
                What is measured is page views, clicks and similar interactions, the page you came
                from, and the coarse technical details your browser sends anyway — approximate
                location from your IP address, device type, and browser. Your name and email are
                not part of this.
              </p>
            </Section>

            <Section heading="How a signup is linked to usage">
              <p className={paragraphClass}>
                When you join the waitlist, your signup is linked to that anonymous usage by an
                opaque token — a random identifier that means nothing outside Saransh&rsquo;s own
                database. It lets us see that a visit ended in a signup without telling the
                analytics vendor who signed up.
              </p>
              <p className={paragraphClass}>
                <strong className="font-semibold text-ink">
                  Your email address is never sent to the analytics vendor.
                </strong>{" "}
                Neither is your name. Someone holding the analytics data alone sees only opaque
                tokens.
              </p>
            </Section>

            <Section heading="Session recording">
              <p className={paragraphClass}>
                A sample of visits is recorded as a replay of what happened on screen — scrolling,
                clicks, and page changes — so we can see where the page confuses people.
              </p>
              <p className={paragraphClass}>
                Recordings never capture what you type into form fields. Your name and email are
                masked before the recording leaves your browser, so they are not in the replay at
                all.
              </p>
            </Section>

            <Section heading="Analytics served from our own domain">
              <p className={paragraphClass}>
                Analytics requests are sent to Saransh&rsquo;s own domain and passed on to the
                vendor from there, rather than going to the vendor&rsquo;s domain directly. We are
                telling you because this also means a content blocker that would normally stop
                those requests will not recognise them. If you would rather not be measured,
                blocking JavaScript on this site keeps you out of the data entirely.
              </p>
            </Section>

            <Section heading="Who holds the data">
              <p className={paragraphClass}>
                Analytics and session recordings are handled by{" "}
                <a
                  href="https://posthog.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  PostHog
                </a>
                , on their cloud service in the United States. Your waitlist name and email stay in
                Saransh&rsquo;s own database and are never sent to PostHog.
              </p>
            </Section>

            <Section heading="Deleting your data">
              <p className={paragraphClass}>
                Ask and it is deleted — your waitlist entry and the analytics attached to its
                token. Message the maintainer on GitHub at{" "}
                <a
                  href={EXTERNAL.maintainer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  @imsks
                </a>{" "}
                or open an issue on the{" "}
                <a
                  href={EXTERNAL.issues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Saransh issue tracker
                </a>
                . An issue is public, so do not put your email address in it — say that you want
                your waitlist entry removed and we will ask you for it privately.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
