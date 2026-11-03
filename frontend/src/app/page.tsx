import { PageShell } from "@/components/layout";
import {
  BottomCTA,
  ContributorsSection,
  HeroSection,
  RajnitiSection,
  WhatSection,
} from "@/components/marketing";

export default function Home() {
  return (
    <PageShell>
      <HeroSection />
      <WhatSection />
      <RajnitiSection />
      <ContributorsSection />
      <BottomCTA />
    </PageShell>
  );
}
