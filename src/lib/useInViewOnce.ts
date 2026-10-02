"use client";

import { useEffect, useRef, useState } from "react";

function isInViewport(el: Element) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  return rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;
}

/**
 * Reliable "has this element entered the viewport" tracker.
 *
 * Uses a native IntersectionObserver as the primary mechanism, with two
 * safety nets: an immediate synchronous check on mount (so already-visible,
 * above-the-fold content never waits on an observer callback), and a
 * lightweight scroll/resize listener that re-checks geometry directly. The
 * fallback matters in practice — IntersectionObserver callbacks have been
 * observed to occasionally never fire for elements very close to the
 * viewport edge at observer-creation time, which would otherwise leave
 * content permanently stuck in its hidden state.
 */
export function useInViewOnce<T extends Element>(margin = "-80px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;

    if (isInViewport(el)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            break;
          }
        }
      },
      { root: null, rootMargin: margin, threshold: 0 }
    );
    observer.observe(el);

    // Safety net: some elements have been observed to never receive an
    // IntersectionObserver callback despite genuinely entering the
    // viewport. A passive scroll/resize listener guarantees correctness.
    const checkGeometry = () => {
      if (el && isInViewport(el)) {
        setInView(true);
      }
    };
    window.addEventListener("scroll", checkGeometry, { passive: true });
    window.addEventListener("resize", checkGeometry, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkGeometry);
      window.removeEventListener("resize", checkGeometry);
    };
  }, [inView, margin]);

  return { ref, inView };
}
