"use client";

import { useEffect, useState } from "react";

import { ThemeToggle } from "@sutra_ui/ui";
import { cx, iconButtonClass } from "@/components/ui";

const placeholderClass = "inline-block size-8 shrink-0";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <span aria-hidden="true" className={placeholderClass} />;

  return <ThemeToggle className={`${cx(iconButtonClass)}`} />;
}
