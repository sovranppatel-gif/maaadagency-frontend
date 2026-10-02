import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

// public/images/logo.png is trimmed to its artwork (900 × 424), so the
// width/height below match its real aspect ratio and it never letterboxes.
const LOGO_WIDTH = 900;
const LOGO_HEIGHT = 424;

export function Logo({
  className,
  imageClassName = "h-12 w-auto sm:h-14",
  eager = false,
  onClick,
}: {
  className?: string;
  imageClassName?: string;
  /** Load immediately — only for the above-the-fold navbar copy. */
  eager?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label={`${site.name} — home`}
      className={cn("inline-flex shrink-0 items-center rounded-md", className)}
    >
      <Image
        src="/images/logo.png"
        alt={`${site.name} logo`}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        sizes="140px"
        loading={eager ? "eager" : "lazy"}
        className={imageClassName}
      />
    </Link>
  );
}
