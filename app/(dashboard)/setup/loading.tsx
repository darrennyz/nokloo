export default function SetupLoading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-10 pb-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-7 w-20 bg-muted rounded-md" />
        <div className="h-4 w-56 bg-muted/60 rounded-md" />
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-muted" />
              <div className="h-3.5 w-14 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Connect Claude section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted/60 rounded" />
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                <div className="h-4 w-48 bg-muted rounded" />
              </div>
              <div className="ml-9 h-3 w-36 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Active connections */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="h-4 w-36 bg-muted rounded" />
          <div className="h-3 w-72 bg-muted/60 rounded" />
        </div>
        <div className="rounded-lg border border-dashed border-border p-8 flex flex-col items-center gap-2">
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="h-3.5 w-32 bg-muted/60 rounded" />
          <div className="h-3 w-48 bg-muted/40 rounded" />
        </div>
      </div>
    </div>
  )
}
