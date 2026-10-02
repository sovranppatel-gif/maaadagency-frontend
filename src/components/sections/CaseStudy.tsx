import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { featuredCaseStudy as study } from "@/data/caseStudy";

export function CaseStudy() {
  return (
    <section id="case-study" aria-labelledby="case-title" className="bg-brand-gray py-20 sm:py-28">
      <Container>
        <article className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal className="relative">
                <div className="overflow-hidden rounded-[2rem] rounded-bl-none bg-white shadow-xl shadow-black/10">
                  <Image
                    src={study.image}
                    alt={study.alt}
                    width={998}
                    height={887}
                    sizes="(min-width: 1024px) 40vw, (min-width: 640px) 80vw, 92vw"
                    className="aspect-[4/5] w-full object-cover object-top sm:aspect-[4/3] lg:aspect-[4/5]"
                  />
                </div>
              </Reveal>

              <dl className="mt-6 grid grid-cols-3 divide-x divide-black/10 rounded-2xl border border-black/10 bg-white">
                {study.facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse px-3 py-4 sm:px-5">
                    <dt className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-black/45">
                      {fact.label}
                    </dt>
                    <dd className="text-sm font-bold leading-snug text-brand-dark sm:text-base">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="lg:col-span-7">
            <SectionHeading
              id="case-title"
              index="05"
              eyebrow={`Case study · ${study.client}`}
              title={study.title}
              highlight="on the road"
            />

            <ol className="mt-10 space-y-4">
              {study.steps.map((step, i) => (
                <li key={step.title}>
                  <Reveal
                    delay={0.05 * i}
                    className="grid grid-cols-[auto_1fr] gap-x-5 rounded-2xl bg-white p-6 sm:p-7"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red/10 font-display text-sm font-bold text-brand-red"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-brand-dark">{step.title}</h3>
                      <p className="mt-1.5 leading-relaxed text-black/65">{step.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col gap-3 xs:flex-row xs:flex-wrap">
              <ButtonLink href="#contact" variant="dark">
                Plan an LED van campaign
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="#testimonials" variant="outline">
                Read client feedback
              </ButtonLink>
            </div>
          </div>
        </article>
      </Container>
    </section>
  );
}
