export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-10 pb-8 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-7 w-24 bg-muted rounded-md" />
        <div className="h-4 w-44 bg-muted/60 rounded-md" />
      </div>

      {/* Account info */}
      <div className="space-y-4">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="rounded-xl border border-border bg-card p-5 space-y-2">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-3 w-56 bg-muted/60 rounded" />
        </div>
      </div>

      {/* Change password */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-md" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-36 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded-md" />
          </div>
          <div className="h-8 w-32 bg-muted rounded-md" />
        </div>
      </div>

      {/* Session */}
      <div className="space-y-4">
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-3 w-56 bg-muted/60 rounded" />
          </div>
          <div className="h-8 w-20 bg-muted rounded-md" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="space-y-4">
        <div className="h-4 w-24 bg-muted/60 rounded" />
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="h-3 w-72 bg-muted/60 rounded" />
          </div>
          <div className="h-9 w-full bg-muted rounded-md" />
          <div className="h-8 w-36 bg-muted rounded-md" />
        </div>
      </div>
    </div>
  )
}
