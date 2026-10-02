"use client";

import { useInViewOnce } from "@/lib/useInViewOnce";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Fade-up on first scroll into view. Pure CSS transition (see `.reveal` in
 * globals.css), so it ships almost no JS and is disabled automatically for
 * reduced-motion users and when scripting is unavailable.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
