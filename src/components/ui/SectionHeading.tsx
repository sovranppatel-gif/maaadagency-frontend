import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  highlight,
  subtitle,
  align = "left",
  tone = "dark",
  className,
}: {
  /** Set on the <h2> so the parent section can use aria-labelledby. */
  id?: string;
  /** Section number shown before the eyebrow, e.g. "01". */
  index?: string;
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  const parts = highlight ? title.split(highlight) : [title];
  const light = tone === "light";

  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em]",
            align === "center" && "justify-center",
            light ? "text-white/70" : "text-brand-red"
          )}
        >
          {index && (
            <span className={light ? "text-brand-red" : "text-brand-dark/40"}>{index}</span>
          )}
          {index && (
            <span
              aria-hidden="true"
              className={cn("h-px w-8", light ? "bg-white/25" : "bg-brand-dark/20")}
            />
          )}
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={cn(
          "font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-balance sm:text-5xl",
          light ? "text-white" : "text-brand-dark"
        )}
      >
        {parts[0]}
        {highlight && <span className="text-brand-red">{highlight}</span>}
        {parts[1]}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed sm:text-lg",
            light ? "text-white/65" : "text-black/60"
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
