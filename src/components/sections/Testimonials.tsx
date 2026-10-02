"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/data/testimonials";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { TestimonialControls } from "./TestimonialControls";

const AUTOPLAY_MS = 7000;
const SLIDE_ID = "testimonial-slide";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  // The user's explicit choice (pause button) wins; until they make one,
  // autoplay is off for reduced-motion users. Hover/focus pauses temporarily.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [hoverPaused, setHoverPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const paused = userPaused ?? reducedMotion;
  const autoplaying = !paused && !hoverPaused;

  const go = useCallback((next: number) => {
    setIndex((next + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    if (!autoplaying) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [autoplaying]);

  const current = testimonials[index];

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="bg-white py-20 sm:py-28">
      <Container>
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Client testimonials"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onFocus={() => setHoverPaused(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setHoverPaused(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(index - 1);
            if (e.key === "ArrowRight") go(index + 1);
          }}
          className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14"
        >
          <div className="flex flex-col justify-between gap-8 lg:col-span-5">
            <SectionHeading
              id="testimonials-title"
              index="06"
              eyebrow="Testimonials"
              title="What our clients say"
              highlight="clients"
              subtitle="Feedback from brands we've worked alongside."
            />
            <TestimonialControls
              count={testimonials.length}
              index={index}
              labels={testimonials.map((t) => t.company)}
              paused={paused}
              onPrev={() => go(index - 1)}
              onNext={() => go(index + 1)}
              onSelect={go}
              onTogglePause={() => setUserPaused(!paused)}
              controlsId={SLIDE_ID}
            />
          </div>

          <div
            id={SLIDE_ID}
            // Announce changes only when the user drives them.
            aria-live={autoplaying ? "off" : "polite"}
            className="relative overflow-hidden rounded-[2rem] rounded-bl-none bg-brand-gray lg:col-span-7"
          >
            <Quote className="absolute bottom-6 right-6 h-14 w-14 text-brand-red/15 sm:bottom-8 sm:right-8 sm:h-20 sm:w-20" aria-hidden="true" />

            <figure
              key={index}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${testimonials.length}`}
              className="relative flex min-h-[20rem] animate-fade-in flex-col justify-between p-7 sm:min-h-[18rem] sm:p-10"
            >
              <blockquote>
                <p className="text-pretty font-display text-xl font-semibold leading-relaxed text-brand-dark sm:text-2xl">
                  &ldquo;{current.quote}&rdquo;
                </p>
              </blockquote>

              <figcaption className="mt-8 flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-sm">
                  <Image
                    src={current.logo}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </span>
                <span>
                  <span className="block font-bold text-brand-dark">{current.name}</span>
                  <span className="block text-sm text-black/55">
                    {current.role}, {current.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </Container>
    </section>
  );
}
