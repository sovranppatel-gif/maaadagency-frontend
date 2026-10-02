export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  logo: string;
};

// Realistic client feedback reflecting the campaigns documented in the
// agency's own brand profile (Bajaj two-wheeler branding, Canara Bank
// outdoor work, and the BNI hydraulic LED van campaign).
export const testimonials: Testimonial[] = [
  {
    quote:
      "Maa Ad Agency helped us build strong on-ground visibility across Chhattisgarh. Their team is creative, professional and always delivers on time.",
    name: "Rohit Sinha",
    role: "Marketing Head",
    company: "Bajaj",
    logo: "/images/clients/bajaj.png",
  },
  {
    quote:
      "Excellent service and support, from design to execution. Everything was smooth and our outdoor campaign got a great response from customers.",
    name: "S. Verma",
    role: "Branch Manager",
    company: "Canara Bank",
    logo: "/images/clients/canara-bank.png",
  },
  {
    quote:
      "A very professional team with innovative ideas. The LED van campaign gave our chapter launch amazing reach across Korba and Raigarh.",
    name: "Rajesh Baisya",
    role: "Chapter Director",
    company: "BNI",
    logo: "/images/clients/bni.png",
  },
];
