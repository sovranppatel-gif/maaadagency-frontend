import { Layers, MapPinned, Building2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { site } from "@/data/site";

// What the agency *is*. How it works lives in Why Choose Us, so the two
// sections never repeat each other.
const values = [
  {
    icon: Layers,
    title: "Every channel under one roof",
    description:
      "Print, TV, radio, outdoor, LED, digital and events, planned together instead of across five vendors.",
  },
  {
    icon: MapPinned,
    title: "Rooted in Chhattisgarh",
    description:
      "Campaigns run on the ground in Raipur, Ambikapur, Dhamtari, Korba and Raigarh.",
  },
  {
    icon: Building2,
    title: "Local dealers to national names",
    description:
      "The same care for a neighbourhood showroom as for brands like Bajaj, Tata and Canara Bank.",
  },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="bg-white py-20 sm:py-28">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <SectionHeading
            id="about-title"
            index="01"
            eyebrow="About us"
            title="More than advertising. We build brand impact."
            highlight="brand impact."
          />
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.08}>
            <p className="text-lg leading-relaxed text-black/65">
              {site.name} is an advertising and branding company established
              in {site.founded}. We handle promotion, printing, outdoor
              advertising, digital marketing and creative branding, so a
              campaign moves from idea to street without changing hands.
            </p>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-brand-dark">
              We turn bold ideas into creative work that earns attention for
              your brand.
            </p>
          </Reveal>

          <ul className="mt-10 divide-y divide-black/10 border-y border-black/10">
            {values.map((value, i) => (
              <li key={value.title}>
                <Reveal delay={0.06 * i} className="flex gap-5 py-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
                    <value.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-brand-dark">
                      {value.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-black/60 sm:text-base">
                      {value.description}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
