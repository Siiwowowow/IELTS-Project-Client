export default function TeacherDashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6 animate-pulse p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="h-5 w-28 rounded-full bg-slate-200" />
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="h-4 w-96 rounded-md bg-slate-100" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-7 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-96 rounded-2xl border border-slate-200 bg-white p-6" />
    </div>
  );
}
