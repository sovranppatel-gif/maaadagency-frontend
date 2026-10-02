import Image from "next/image";
import { ArrowRight, ArrowDownRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { companyStats } from "@/data/site";
import { featuredCaseStudy } from "@/data/caseStudy";
import { ClientLogos } from "./ClientLogos";

const channels = ["Outdoor", "LED", "Print", "Digital", "Events"];

export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-white pb-14 pt-28 sm:pt-36"
    >
      {/* Soft brand glow + grid, purely decorative */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-brand-red/[0.07] blur-3xl" />
        <svg className="absolute inset-0 h-full w-full text-brand-dark opacity-[0.035]">
          <pattern id="hero-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0H0V56" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-[0.22em] text-brand-dark/60">
              <span className="text-brand-red">360° advertising agency</span>
              <span aria-hidden="true">·</span>
              <span>Raipur, Chhattisgarh</span>
            </p>

            <h1
              id="hero-title"
              className="mt-5 font-display text-[2.75rem] font-extrabold leading-[0.98] tracking-tight text-brand-dark xs:text-6xl sm:text-7xl xl:text-[5.25rem]"
            >
              Turn Ideas
              <span className="block text-brand-red">Into Impact.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/65 sm:text-xl">
              We plan, design and run campaigns for local businesses and
              national brands — on hoardings, LED vans and screens, in print,
              online and on the ground.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Channels we cover">
              {channels.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-dark/75"
                >
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <ButtonLink href="#contact">
                Start a Project
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="#work" variant="outline">
                See Our Work
              </ButtonLink>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-y-6 border-t border-black/10 pt-8 sm:grid-cols-4">
              {companyStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col-reverse justify-end ${i % 2 === 1 ? "border-l border-black/10 pl-5 sm:pl-6" : i > 0 ? "sm:border-l sm:border-black/10 sm:pl-6" : ""}`}
                >
                  <dt className="mt-1 text-xs font-medium leading-tight text-black/55 sm:text-sm">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-3xl font-extrabold text-brand-dark sm:text-4xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual — the flagship campaign, linked to its case study */}
          <div className="lg:col-span-6 xl:col-span-6">
            <figure className="relative mx-auto max-w-[560px] lg:ml-auto lg:mr-0">
              <div aria-hidden="true" className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-[2rem] rounded-bl-none bg-brand-red sm:block" />
              <div className="relative overflow-hidden rounded-[2rem] rounded-bl-none bg-brand-gray shadow-2xl shadow-black/15">
                <Image
                  src={featuredCaseStudy.image}
                  alt={featuredCaseStudy.alt}
                  width={998}
                  height={887}
                  preload
                  fetchPriority="high"
                  sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, (min-width: 640px) 560px, 92vw"
                  className="aspect-[1/1] w-full object-cover sm:aspect-[9/8]"
                />
              </div>

              <figcaption className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto">
                <a
                  href="#case-study"
                  className="group flex items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 shadow-xl shadow-black/15 backdrop-blur transition-colors hover:bg-white"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-white">
                    <ArrowDownRight className="h-4 w-4 transition-transform group-hover:rotate-[-45deg]" aria-hidden="true" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red">
                      Featured campaign
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-brand-dark">
                      {featuredCaseStudy.client} LED van · {featuredCaseStudy.facts[1].value}
                    </span>
                  </span>
                </a>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-16 sm:mt-20">
          <ClientLogos />
        </div>
      </Container>
    </section>
  );
}
