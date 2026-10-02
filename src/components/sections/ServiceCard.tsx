import { ArrowRight } from "lucide-react";
import type { Service } from "@/data/services";

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  const Icon = service.icon;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-red/30 hover:shadow-xl hover:shadow-black/[0.06] motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gray text-brand-red transition-colors duration-300 group-hover:bg-brand-red group-hover:text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span aria-hidden="true" className="font-display text-sm font-bold text-black/20">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="mt-5 font-display text-lg font-bold text-brand-dark">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-black/60">{service.description}</p>

      {/* Contact listens for [data-enquire-service] clicks and preselects the service. */}
      <a
        href="#contact"
        data-enquire-service={service.title}
        className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-bold text-brand-dark transition-colors hover:text-brand-red"
      >
        Enquire
        <span className="sr-only"> about {service.title}</span>
        <ArrowRight className="h-4 w-4 text-brand-red transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </a>
    </article>
  );
}
