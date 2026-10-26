
import Link from "next/link";
import { ArrowLeft, Newspaper, Clock } from "lucide-react";

export default function NewsPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071a2d] px-4 py-12 sm:px-6">
      {/* Background Effects */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#2374A8]/20 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#D52B1E]/10 blur-[120px]" />

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* News Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#7DD3FC]/20 bg-[#2374A8]/15 shadow-lg sm:h-24 sm:w-24">
          <Newspaper
            size={44}
            strokeWidth={1.5}
            className="text-[#7DD3FC]"
          />
        </div>

        {/* Status Badge */}
        <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#7DD3FC]/20 bg-[#2374A8]/10 px-4 py-2">
          <Clock size={14} className="text-[#7DD3FC]" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7DD3FC]">
            Coming Soon
          </span>
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
          News &amp; Updates
          <span className="mt-2 block text-[#7DD3FC]">
            Coming Soon.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
          We&apos;re preparing the latest funding announcements, program
          updates, important deadlines, and news from Innovative Business
          Solutions Ltd.
        </p>

        {/* Decorative Line */}
        <div className="mx-auto mt-7 h-1 w-16 rounded-full bg-[#D52B1E]" />

        {/* Back Button */}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2374A8] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#1B608D] hover:shadow-lg"
        >
          <ArrowLeft size={17} />
          Back to Funding Programs
        </Link>
      </div>
    </main>
  );
}
