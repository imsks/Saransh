import type { ReactNode } from "react";

import Footer from "./Footer";
import Navbar from "./Navbar";

export default function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-paper">
      <Navbar />
      <main className={className}>{children}</main>
      <Footer />
    </div>
  );
}
