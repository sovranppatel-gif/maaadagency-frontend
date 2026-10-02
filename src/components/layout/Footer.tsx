import Link from "next/link";
import { site, navLinks } from "@/data/site";
import { services } from "@/data/services";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { socialLinks } from "@/components/ui/SocialIcons";

// A short list keeps the footer light; the full list lives in Services.
const footerServices = services.slice(0, 6).map((s) => s.title);

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <Container className="py-14 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo imageClassName="h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              An advertising and branding company helping businesses grow
              through creativity, strategy and media that gets seen.
            </p>
            <ul className="mt-6 flex items-center gap-3" aria-label="Social media">
              {socialLinks.map(({ Icon, href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-brand-red hover:bg-brand-red hover:text-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-labelledby="footer-nav-title">
            <h2 id="footer-nav-title" className="font-display text-sm font-bold uppercase tracking-[0.15em] text-white/90">
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.href} className="text-sm text-white/60 transition-colors hover:text-brand-red">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-white/90">
              Main services
            </h2>
            <ul className="mt-5 space-y-3">
              {footerServices.map((s) => (
                <li key={s}>
                  <Link href="/#services" className="text-sm text-white/60 transition-colors hover:text-brand-red">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center gap-2 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p>Ideas Today. A Stronger Tomorrow.</p>
        </Container>
      </div>
    </footer>
  );
}
