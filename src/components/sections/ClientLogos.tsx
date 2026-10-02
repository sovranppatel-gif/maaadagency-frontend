import Image from "next/image";
import { clients } from "@/data/clients";

/** Slim, auto-scrolling strip of real client logos. Pauses on hover. */
export function ClientLogos() {
  return (
    <div className="border-t border-black/5 pt-10">
      <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-black/45 sm:text-left">
        Trusted by brands including
      </p>

      <div className="marquee-row relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto">
        <div className="marquee-track flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            // The second copy only exists to make the loop seamless.
            <ul
              key={copy}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16"
            >
              {clients.map((client) => (
                <li
                  key={client.name}
                  className="flex h-12 w-28 shrink-0 items-center justify-center opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-14 sm:w-32"
                >
                  <Image
                    src={client.logo}
                    alt={copy === 1 ? "" : `${client.name} logo`}
                    width={160}
                    height={70}
                    sizes="128px"
                    className="h-full w-full object-contain"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
