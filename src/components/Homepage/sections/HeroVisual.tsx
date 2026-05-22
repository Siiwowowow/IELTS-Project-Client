import { cn } from "@/lib/utils";

/** Clean CBT preview — no floating overlays */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)]">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="flex-1 text-center text-xs font-medium text-slate-500">
            IELTS on Computer — Mock Test
          </span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-ielts-red">
              Reading
            </span>
            <span className="font-mono text-xs text-slate-500">01:12:40</span>
          </div>

          <div className="space-y-2 rounded-lg bg-slate-50 p-4">
            {["w-full", "w-[95%]", "w-[88%]", "w-full", "w-[72%]"].map((w, i) => (
              <div
                key={i}
                className={cn("h-2 rounded-full bg-slate-200/90", w)}
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-[10px] font-medium",
                  i === 5
                    ? "bg-ielts-red text-white"
                    : i < 8
                      ? "bg-emerald-50 text-emerald-700"
                      : "border border-slate-200 bg-white text-slate-500"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg sm:-left-6">
        <p className="text-xs text-slate-500">Overall band</p>
        <p className="text-xl font-semibold text-slate-900">7.5</p>
      </div>
    </div>
  );
}
