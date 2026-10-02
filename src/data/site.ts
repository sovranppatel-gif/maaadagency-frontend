export const site = {
  name: "Maa Ad Agency",
  tagline: "Turn Ideas Into Impact",
  url: "https://www.maaadagency.com",
  founded: 2010,
  description:
    "Raipur advertising agency since 2010 — outdoor hoardings, LED vans and screens, wall branding, printing, digital marketing and events across Chhattisgarh.",
};

// `id` must match a section id on the landing page; the navbar scroll-spy
// and every in-page link rely on it.
export const navLinks = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "why-us", label: "Why Us" },
  { id: "work", label: "Portfolio" },
  { id: "testimonials", label: "Testimonials" },
  { id: "contact", label: "Contact" },
].map((link) => ({ ...link, href: `/#${link.id}` }));

// The only place these numbers live. Shown once, in the hero.
export const companyStats = [
  { value: "15+", label: "Years of experience" },
  { value: "100+", label: "Brands served" },
  { value: "1000+", label: "Campaigns delivered" },
  { value: "360°", label: "Brand solutions" },
];
