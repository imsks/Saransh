"use client";

import type { ReactNode } from "react";

import { ThemeProvider as SutraThemeProvider } from "@sutra_ui/ui";

/**
 * Wraps the app in Sutra's theme controller. Sutra toggles the `.dark` class on
 * the document root, which flips both the `--sutra-*` tokens and Saransh's
 * newsprint palette (see `app/globals.css`).
 *
 * The inline script in `app/layout.tsx` applies the stored preference before
 * first paint; this provider owns it from hydration onwards. Both read the same
 * `saransh-theme` key.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SutraThemeProvider defaultTheme="system" storageKey="saransh-theme">
      {children}
    </SutraThemeProvider>
  );
}
