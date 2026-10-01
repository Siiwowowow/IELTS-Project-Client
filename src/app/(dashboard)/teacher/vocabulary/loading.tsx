export default function VocabularyLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-full bg-slate-200" />
          <div className="h-8 w-56 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 rounded-md bg-slate-100" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-slate-200" />
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-w-0 w-full">
        {/* Left Form Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-6 w-44 rounded-md bg-slate-200" />
            <div className="h-4 w-16 rounded-md bg-slate-100" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-slate-100" />
              <div className="h-10 rounded-lg bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-slate-100" />
              <div className="h-10 rounded-lg bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-10 rounded-lg bg-slate-100" />
              <div className="h-10 rounded-lg bg-slate-100" />
            </div>
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>

          <div className="h-11 rounded-xl bg-indigo-100 w-full" />
        </div>

        {/* Right List Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden space-y-4">
          {/* Header & Filter Skeleton */}
          <div className="border-b border-slate-200 p-4 sm:p-5 space-y-3 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div className="h-5 w-40 rounded-md bg-slate-200" />
              <div className="h-7 w-32 rounded-lg bg-slate-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 flex-1 rounded-lg bg-slate-200" />
              <div className="h-9 w-28 rounded-lg bg-slate-200" />
            </div>
          </div>

          {/* Word Item Skeletons */}
          <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pt-4 first:pt-0 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-slate-200" />
                  <div className="h-5 w-28 rounded-md bg-slate-200" />
                  <div className="h-4 w-12 rounded-md bg-slate-100" />
                  <div className="h-4 w-16 rounded-md bg-slate-100" />
                </div>
                <div className="h-4 w-36 rounded-md bg-indigo-100" />
                <div className="h-3 w-5/6 rounded-md bg-slate-100" />
                <div className="h-12 w-full rounded-lg bg-slate-50 border border-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
