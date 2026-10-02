import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceCard } from "./ServiceCard";
import { services } from "@/data/services";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="bg-brand-gray py-20 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="services-title"
            index="02"
            eyebrow="What we do"
            title="Everything your campaign needs"
            highlight="your campaign"
          />
          <Reveal delay={0.1} className="max-w-sm lg:pb-2">
            <p className="text-base leading-relaxed text-black/60">
              Pick one service or combine several into a single campaign —
              tell us which and we&apos;ll plan around it.
            </p>
          </Reveal>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, i) => (
            <li key={service.title}>
              <ServiceCard service={service} index={i} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
