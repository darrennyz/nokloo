export default function ProjectsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-24 bg-muted rounded-md" />
          <div className="h-4 w-20 bg-muted/60 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-muted rounded-md" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-full bg-muted/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
