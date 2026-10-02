import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-brand-red text-white shadow-lg shadow-brand-red/25 hover:bg-brand-red-dark",
  dark: "bg-brand-dark text-white hover:bg-brand-red",
  outline:
    "border-2 border-brand-dark/15 text-brand-dark hover:border-brand-dark",
  light: "bg-white text-brand-red shadow-lg shadow-black/10 hover:bg-white/90",
  "outline-light": "border-2 border-white/40 text-white hover:border-white",
} as const;

export type ButtonVariant = keyof typeof variants;

/** The site's single CTA style. Renders an anchor, so it works without JS. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a"> & {
  variant?: ButtonVariant;
  size?: "md" | "sm";
}) {
  return (
    <a
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors duration-200",
        size === "md" ? "min-h-12 px-7 py-3.5 text-sm" : "min-h-10 px-5 py-2.5 text-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
