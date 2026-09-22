import Image from "next/image";

const TOPICS = [
  { label: "IELTS", active: true },
  { label: "Academic English", active: false },
  { label: "University Admission", active: false },
  { label: "Vocabulary", active: false },
  { label: "Grammar", active: false },
];

export function UniversitySection() {
  return (
    <section id="university" className="bg-[#f8f3e9] py-14 sm:py-18 lg:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden bg-[#fbf8f0] shadow-[0_20px_60px_rgba(54,47,36,0.08)]">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-20"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(rgba(39,42,39,.18) .55px, transparent .55px)",
              backgroundSize: "7px 7px",
            }}
          />

          <div className="grid lg:min-h-96 lg:grid-cols-[0.78fr_1.22fr] lg:items-stretch">
            <div className="relative z-20 flex flex-col justify-center px-7 py-11 sm:px-11 lg:px-12 lg:py-10 xl:px-14">
              <p className="w-fit rounded-full bg-[#fff0eb] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#ff493c]">
                University admission
              </p>

              <h2 className="mt-4 max-w-md text-[2.55rem] font-black uppercase leading-[0.86] tracking-[-0.07em] text-[#111827] sm:text-[3.15rem] lg:text-[3.55rem]">
                Your English.
                <span className="block">Your Future.</span>
              </h2>

              <p className="mt-4 max-w-sm text-xs font-medium leading-5 text-[#69706c] sm:text-sm">
                Prepare for IELTS, academic English and university admission
                with one learning platform.
              </p>

              <div className="mt-5 flex max-w-md flex-wrap gap-2">
                {TOPICS.map((topic) => (
                  <span
                    key={topic.label}
                    className={`rounded-md border px-3 py-1.5 text-[10px] font-bold shadow-[0_2px_5px_rgba(30,35,32,0.04)] ${
                      topic.active
                        ? "border-[#ffb9b1] bg-white text-[#ff493c]"
                        : "border-[#d7d9d5] bg-[#fffefa]/90 text-[#4d5551]"
                    }`}
                  >
                    {topic.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-80 overflow-hidden sm:min-h-100 lg:min-h-full lg:-ml-8">
              <Image
                src="/banner/university-editorial-collage.png"
                alt="University application checklist, passport, campus and graduation cap"
                fill
                sizes="(max-width: 1024px) 100vw, 64vw"
                className="object-cover object-center"
              />

              <div
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-[#fbf8f0] via-[#fbf8f0]/75 to-transparent lg:block"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#fbf8f0] to-transparent lg:hidden"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
