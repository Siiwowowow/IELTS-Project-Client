import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className=" py-16 sm:py-20 lg:py-24">
      <div className="w-full">
        <div className="relative overflow-hidden bg-[#fbf8f0] shadow-[0_20px_60px_rgba(52,46,36,0.08)]">
          <Image
            src="/banner/final-cta-illustration.png"
            alt="Students learning and reaching their goals"
            fill
            sizes="100vw"
            className="pointer-events-none hidden select-none object-cover object-center lg:block"
          />

          <div className="relative z-10 grid gap-8 px-7 pb-9 pt-10 sm:px-10 sm:pb-11 sm:pt-12 lg:min-h-88 lg:grid-cols-[1.05fr_0.88fr_0.72fr] lg:items-center lg:gap-10 lg:px-[18%] lg:py-10 lg:pr-[12%]">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#f13a2c]">
                Your next chapter
              </p>
              <h2 className="mt-3 text-[2.5rem] font-black uppercase leading-[0.86] tracking-[-0.07em] text-[#111827] sm:text-[3.2rem] lg:text-[3.35rem]">
                Your target
                <span className="block">score starts</span>
                <span className="block text-[#f13a2c]">here.</span>
              </h2>
            </div>

            <div>
              <p className="max-w-xs text-xs font-medium leading-5 text-[#5e6661] sm:text-sm sm:leading-6">
                Build better English with a focused learning system designed
                around your goals.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2.5 bg-[#f13a2c] px-5 py-3 text-xs font-black text-white shadow-[3px_4px_0_#b9251b] transition-transform hover:-translate-y-0.5"
                >
                  Start learning
                  <ArrowRight className="size-4 stroke-[3] transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/mock-tests/full"
                  className="group inline-flex items-center gap-2.5 border-2 border-[#252a27] bg-[#fffdf8]/90 px-5 py-3 text-xs font-black text-[#252a27] transition-colors hover:bg-[#252a27] hover:text-white"
                >
                  Take a free test
                  <ArrowRight className="size-4 stroke-[3] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            <div className="relative w-fit select-none lg:justify-self-center">
              <p className="text-[5.7rem] font-black leading-[0.78] tracking-[-0.1em] text-[#f13a2c] sm:text-[7.4rem] lg:text-[7.7rem]">
                8.5<span className="align-top text-[0.46em] tracking-[-0.04em]">+</span>
              </p>
              <span className="absolute -bottom-3 left-4 h-1.5 w-[88%] -rotate-2 bg-[#1769e8]" aria-hidden="true" />
              <span className="absolute -bottom-1 left-12 h-1 w-[72%] rotate-1 bg-[#1769e8]" aria-hidden="true" />
            </div>
          </div>

          <div className="relative h-44 w-full overflow-hidden lg:hidden">
            <Image
              src="/banner/final-cta-illustration.png"
              alt=""
              fill
              sizes="100vw"
              className="pointer-events-none select-none object-cover object-center"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
