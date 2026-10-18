"use client";

import { useEffect, type ReactNode } from "react";

import { initAnalytics } from "@/lib/analytics";

export default function AnalyticsProvider({ children }: { children: ReactNode }) {
  useEffect(initAnalytics, []);

  return <>{children}</>;
}
