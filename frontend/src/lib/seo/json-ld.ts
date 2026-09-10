import { defaultDescription, getSiteUrl, SITE_NAME } from "@/lib/seo/site";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

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

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
