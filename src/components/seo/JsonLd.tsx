import { site } from "@/data/site";
import { contactInfo } from "@/data/contact";
import { services } from "@/data/services";

// Only facts the project already states. Deliberately omitted because they
// aren't verified anywhere in the codebase: ratings/reviews, opening hours,
// geo coordinates and social profile URLs (sameAs).
function buildSchema() {
  const orgId = `${site.url}/#organization`;
  const phone = (p: string) => `+91-${p.replace(/\s+/g, "-")}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": orgId,
        name: site.name,
        url: site.url,
        logo: `${site.url}/images/logo.png`,
        image: `${site.url}/opengraph-image.jpg`,
        description: site.description,
        foundingDate: String(site.founded),
        email: contactInfo.email,
        telephone: phone(contactInfo.phones[0]),
        contactPoint: contactInfo.phones.map((p) => ({
          "@type": "ContactPoint",
          telephone: phone(p),
          contactType: "customer service",
          areaServed: "IN",
        })),
        address: {
          "@type": "PostalAddress",
          streetAddress: contactInfo.address.street,
          addressLocality: contactInfo.address.locality,
          addressRegion: contactInfo.address.region,
          addressCountry: contactInfo.address.country,
        },
        areaServed: { "@type": "State", name: "Chhattisgarh" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Advertising & branding services",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.title, description: s.description },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        inLanguage: "en-IN",
        publisher: { "@id": orgId },
      },
    ],
  };
}

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so the payload can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema()).replace(/</g, "\\u003c") }}
    />
  );
}
