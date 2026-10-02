import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red";

/** One set of carousel controls for every breakpoint. */
export function TestimonialControls({
  count,
  index,
  labels,
  paused,
  onPrev,
  onNext,
  onSelect,
  onTogglePause,
  controlsId,
}: {
  count: number;
  index: number;
  /** Accessible name for each slide's dot, e.g. the client's company. */
  labels: string[];
  paused: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
  onTogglePause: () => void;
  controlsId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onPrev} aria-controls={controlsId} aria-label="Previous testimonial" className={iconButton}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" onClick={onNext} aria-controls={controlsId} aria-label="Next testimonial" className={iconButton}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="mx-1 flex items-center gap-1" role="group" aria-label="Choose a testimonial">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-controls={controlsId}
            aria-current={i === index ? "true" : undefined}
            aria-label={`Testimonial ${i + 1} of ${count}: ${labels[i]}`}
            // 44px tap target around a small visual dot.
            className="group flex h-11 w-7 items-center justify-center"
          >
            <span
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-brand-red" : "w-2 bg-black/20 group-hover:bg-black/40"
              )}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onTogglePause}
        aria-label={paused ? "Resume automatic rotation" : "Pause automatic rotation"}
        className={iconButton}
      >
        {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
