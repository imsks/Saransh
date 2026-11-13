import type { ReactNode } from "react";

import Footer from "./Footer";
import Navbar from "./Navbar";

/** Every page's frame: paper ground, sticky masthead, footer. */
export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
