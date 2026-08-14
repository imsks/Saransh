import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhatSection from "@/components/WhatSection";
import RajnitiSection from "@/components/RajnitiSection";
import BottomCTA from "@/components/BottomCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhatSection />
        <RajnitiSection />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}
