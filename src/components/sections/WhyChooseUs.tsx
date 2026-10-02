import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { processSteps, whyPoints } from "@/data/whyChooseUs";

export function WhyChooseUs() {
  return (
    <section id="why-us" aria-labelledby="why-title" className="bg-brand-dark py-20 text-white sm:py-28">
      <Container>
        <SectionHeading
          id="why-title"
          index="03"
          eyebrow="Why choose us"
          title="A clear process, from brief to launch"
          highlight="brief to launch"
          tone="light"
          subtitle="Every campaign follows the same five steps, so you always know what's happening and what comes next."
        />

        {/* Process */}
        <ol className="mt-14 grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal
                delay={0.06 * i}
                className="h-full border-l border-white/10 py-5 pl-6 pr-4 lg:border-l-0 lg:border-t lg:pl-0 lg:pr-6 lg:pt-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[5px] top-7 h-2.5 w-2.5 rounded-full bg-brand-red lg:-top-[5px] lg:left-0"
                />
                <p className="font-display text-sm font-bold text-brand-red">
                  Step {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        {/* Differentiators */}
        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyPoints.map((point, i) => (
            <li key={point.title}>
              <Reveal
                delay={0.06 * i}
                className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <point.icon className="h-6 w-6 text-brand-red" aria-hidden="true" />
                <h3 className="mt-4 font-display text-base font-bold">{point.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{point.description}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
