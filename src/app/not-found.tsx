import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-white py-24">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-red/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-brand-red/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center px-5 text-center">
        <Image
          src="/images/logo.png"
          alt="Maa Ad Agency"
          width={900}
          height={424}
          sizes="140px"
          className="h-12 w-auto"
        />

        <p className="mt-10 font-display text-[7rem] font-extrabold leading-none text-brand-red sm:text-[9rem]">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-brand-dark sm:text-4xl">
          This Page Took a Wrong Turn.
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-black/55">
          The page you&apos;re looking for doesn&apos;t exist or may have
          been moved. Let&apos;s get you back on track.
        </p>

        <Link
          href="/"
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-brand-red px-7 py-4 text-sm font-bold text-white shadow-xl shadow-brand-red/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </section>
  );
}
