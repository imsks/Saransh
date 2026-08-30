import { Footer, Navbar } from "@/components/layout";
import {
  BottomCTA,
  HeroSection,
  RajnitiSection,
  WhatSection,
} from "@/components/marketing";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main>
        <HeroSection />
        <WhatSection />
        <RajnitiSection />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
