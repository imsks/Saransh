"use client";

import type { ReactNode } from "react";

import { ThemeProvider as SutraThemeProvider } from "@sutra_ui/ui";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SutraThemeProvider defaultTheme="system" storageKey={THEME_STORAGE_KEY}>
      {children}
    </SutraThemeProvider>
  );
}
