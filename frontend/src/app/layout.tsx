import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import JsonLd from "@/components/seo/JsonLd";
import Splash from "@/components/splash/Splash";
import { AnalyticsProvider, AuthProvider, ThemeProvider } from "@/components/providers";
import { EXTERNAL } from "@/lib/routes";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/json-ld";
import {
  buildDefaultOg,
  buildDefaultTwitter,
  defaultDescription,
  getSiteUrl,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  authors: [{ name: "Saransh contributors", url: EXTERNAL.repo }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    ...buildDefaultOg(),
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: buildDefaultTwitter(),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <JsonLd data={[buildWebSiteJsonLd(), buildOrganizationJsonLd()]} />
        <AnalyticsProvider>
          <AuthProvider>
            <ThemeProvider>
              <Splash />
              {children}
            </ThemeProvider>
          </AuthProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
