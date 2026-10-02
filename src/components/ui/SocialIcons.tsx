import type { SVGProps } from "react";
import { contactInfo } from "@/data/contact";

// lucide-react no longer ships brand/social icons, so these are small,
// self-contained SVG glyphs kept consistent with the rest of the icon set.

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M15 8.5h2V5h-2.2C12.6 5 11 6.6 11 8.9V11H9v3.5h2V21h3.2v-6.5H17l.6-3.5h-2.4V9.2c0-.5.3-.7.8-.7Z" />
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="7.5" y1="10" x2="7.5" y2="17" />
      <circle cx="7.5" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11.5 17v-4.2c0-1.5 1-2.6 2.4-2.6 1.4 0 2.1 1 2.1 2.6V17" />
      <line x1="11.5" y1="10" x2="11.5" y2="17" />
    </svg>
  );
}

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.6 9.6 14.8 12l-4.2 2.4Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export const socialLinks = [
  { Icon: InstagramIcon, href: contactInfo.social.instagram, label: "Instagram" },
  { Icon: FacebookIcon, href: contactInfo.social.facebook, label: "Facebook" },
  { Icon: LinkedInIcon, href: contactInfo.social.linkedin, label: "LinkedIn" },
  { Icon: YouTubeIcon, href: contactInfo.social.youtube, label: "YouTube" },
];
