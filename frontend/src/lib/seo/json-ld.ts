import { EXTERNAL } from "@/lib/routes";
import { defaultDescription, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

const base = () => ({
  "@context": "https://schema.org",
  name: SITE_NAME,
  url: getSiteUrl(),
  description: defaultDescription,
});

export function buildWebSiteJsonLd(): Record<string, unknown> {
  return { ...base(), "@type": "WebSite", inLanguage: "en-IN" };
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  return { ...base(), "@type": "NewsMediaOrganization", sameAs: [EXTERNAL.repo] };
}
