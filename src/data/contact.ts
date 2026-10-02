// Single source of truth for the agency's contact details. Every component
// (Contact, Footer, Navbar, mobile actions, JSON-LD) reads from here.

export const contactInfo = {
  phones: ["79743 51591", "78691 87165"],
  email: "info@maaadagency.com",
  website: "www.maaadagency.com",
  address: {
    line1: "Manjeet Tower, Near Raipura Chowk,",
    line2: "Raipur (C.G.)",
    // Structured form of the same address, used for schema.org markup.
    street: "Manjeet Tower, Near Raipura Chowk",
    locality: "Raipur",
    region: "Chhattisgarh",
    country: "IN",
  },
  registrationOffice: {
    line1: "Ring Road No. 1,",
    line2: "Near Kushalpur Chowk, Raipur (C.G.)",
  },
  social: {
    instagram: "https://instagram.com/maaadagency",
    facebook: "https://facebook.com/maaadagency",
    linkedin: "https://linkedin.com/company/maaadagency",
    youtube: "https://youtube.com/@maaadagency",
  },
};

export const primaryPhone = contactInfo.phones[0];

export function formatPhone(phone: string) {
  return `+91 ${phone}`;
}

export function telHref(phone: string) {
  return `tel:+91${phone.replace(/\s+/g, "")}`;
}

export function whatsappHref(phone: string, message?: string) {
  const digits = phone.replace(/\s+/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/91${digits}${text}`;
}
