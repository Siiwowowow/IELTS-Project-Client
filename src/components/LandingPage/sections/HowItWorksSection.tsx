import { ArrowDown, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Learn",
    description: "Get the right concepts and proven strategies.",
  },
  {
    number: "02",
    title: "Practice",
    description: "Apply what you learn with real IELTS questions.",
  },
  {
    number: "03",
    title: "Get feedback",
    description: "Track your progress and discover the gaps.",
  },
  {
    number: "04",
    title: "Improve",
    description: "Build stronger skills and reach your target.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden px-6 py-9  sm:px-9 sm:py-11 lg:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(rgba(25,28,26,.18) .55px, transparent .55px)",
              backgroundSize: "7px 7px",
            }}
          />

          <div className="relative grid gap-10 lg:grid-cols-[0.72fr_3.28fr] lg:items-center lg:gap-12">
            <div className="relative">
              <p className="text-[2.8rem] font-black uppercase leading-[0.78] tracking-[-0.085em] text-[#171a19] sm:text-[3.5rem] lg:text-[3.25rem] xl:text-[3.7rem]">
                Learn.
                <span className="block">Practice.</span>
                <span className="block">Improve.</span>
                <span className="block text-[#f13a2c]">Repeat.</span>
              </p>

              <div className="relative mt-3 h-3 w-40 sm:w-48" aria-hidden="true">
                <span className="absolute left-0 top-0 h-1.5 w-full -rotate-2 bg-[#f13a2c]" />
                <span className="absolute left-4 top-2 h-1 w-[85%] rotate-1 bg-[#f13a2c]" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((step, index) => (
                <div key={step.number} className="relative">
                  <article
                    className={`flex min-h-45 flex-col border-2 border-[#323734] bg-[#fffdf7]/90 p-4 shadow-[4px_5px_0_rgba(32,36,34,0.12)] transition-transform duration-300 hover:-translate-y-1 sm:min-h-48 ${
                      index % 2 === 0 ? "-rotate-[0.5deg]" : "rotate-[0.5deg]"
                    }`}
                  >
                    <span className="text-4xl font-black leading-none tracking-[-0.08em] text-[#111412] sm:text-[2.7rem]">
                      {step.number}
                    </span>
                    <h3 className="mt-2 text-base font-black uppercase tracking-[-0.035em] text-[#171a19] sm:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-38 text-xs font-medium leading-5 text-[#555d58]">
                      {step.description}
                    </p>
                    <span className="mt-auto h-1 w-8 bg-[#f13a2c]" aria-hidden="true" />
                  </article>

                  {index < STEPS.length - 1 && (
                    <>
                      <div className="absolute -right-8 top-1/2 z-10 hidden -translate-y-1/2 text-[#171a19] lg:block">
                        <ArrowRight className="size-6 stroke-[3.2]" />
                      </div>
                      <div className="absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 text-[#171a19] sm:hidden">
                        <ArrowDown className="size-5 stroke-[3]" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
