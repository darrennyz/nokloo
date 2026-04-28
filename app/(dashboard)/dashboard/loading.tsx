export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-28 bg-muted rounded-md" />
          <div className="h-4 w-44 bg-muted/60 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-muted rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <div className="h-3 w-12 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-muted" />
              <div className="space-y-1 flex-1">
                <div className="h-3.5 w-40 bg-muted rounded" />
                <div className="h-3 w-64 bg-muted/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
