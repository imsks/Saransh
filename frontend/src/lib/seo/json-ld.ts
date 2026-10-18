import { defaultDescription, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

export function buildWebSiteJsonLd(): Record<string, unknown> {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: base,
    description: defaultDescription,
    inLanguage: "en-IN",
  };
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    url: base,
    description: defaultDescription,
    sameAs: ["https://github.com/imsks/Saransh"],
  };
}
