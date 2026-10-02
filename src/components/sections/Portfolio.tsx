"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioFilters } from "./PortfolioFilters";
import { portfolio, portfolioFilters, type PortfolioCategory } from "@/data/portfolio";

type Filter = "All" | PortfolioCategory;

const counts = Object.fromEntries(
  portfolioFilters.map((f) => [
    f,
    f === "All" ? portfolio.length : portfolio.filter((p) => p.categories.includes(f)).length,
  ])
);

export function Portfolio() {
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(
    () => (filter === "All" ? portfolio : portfolio.filter((item) => item.categories.includes(filter))),
    [filter]
  );

  return (
    <section id="work" aria-labelledby="work-title" className="bg-white py-20 sm:py-28">
      <Container>
        <SectionHeading
          id="work-title"
          index="04"
          eyebrow="Portfolio"
          title="Our recent work"
          highlight="recent work"
          subtitle="Campaigns we've planned, produced and delivered across Chhattisgarh."
        />

        <div className="mt-10">
          <PortfolioFilters filters={portfolioFilters} active={filter} counts={counts} onChange={setFilter} />
        </div>

        <p className="sr-only" aria-live="polite">
          Showing {filtered.length} {filtered.length === 1 ? "project" : "projects"}
          {filter === "All" ? "" : ` in ${filter}`}
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            // Keying on the filter replays the fade-in each time the set changes.
            <li key={`${filter}-${item.image}`}>
              <PortfolioCard item={item} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
