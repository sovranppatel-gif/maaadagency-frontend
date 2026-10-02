import Image from "next/image";
import { MapPin } from "lucide-react";
import type { PortfolioItem } from "@/data/portfolio";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <article className="group flex h-full animate-fade-in flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white transition-shadow duration-300 hover:shadow-xl hover:shadow-black/[0.07]">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-gray">
        <Image
          src={item.image}
          alt={item.alt}
          fill
          sizes="(min-width: 1280px) 400px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:group-hover:scale-100"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
          {item.categories.map((c) => (
            <li
              key={c}
              className="rounded-full bg-brand-red/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-red"
            >
              {c}
            </li>
          ))}
        </ul>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug text-brand-dark">{item.title}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-black/60">{item.description}</p>
        {item.location && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-black/50">
            <MapPin className="h-3.5 w-3.5 text-brand-red" aria-hidden="true" />
            {item.location}
          </p>
        )}
      </div>
    </article>
  );
}
