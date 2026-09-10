import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";

import JsonLd from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/providers";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/json-ld";
import {
  buildDefaultOg,
  buildDefaultTwitter,
  defaultDescription,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo/site";

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
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — India's Hyperlocal News Digest`,
    template: `%s | ${SITE_NAME}`,
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  authors: [
    { name: "Saransh contributors", url: "https://github.com/imsks/Saransh" },
  ],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    ...buildDefaultOg(),
    title: `${SITE_NAME} — India's Hyperlocal News Digest`,
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
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Applies the stored theme before first paint so a dark-mode reader
          never sees a white flash. Reads the same key as the ThemeProvider.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('saransh-theme');
                  if (theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <JsonLd data={[buildWebSiteJsonLd(), buildOrganizationJsonLd()]} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
