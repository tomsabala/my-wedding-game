function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-wedding-surface-container ${className ?? ''}`} />
}

export default function GameOverviewLoading() {
  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Bone className="h-7 w-48" />
            <Bone className="h-4 w-64" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
          <Bone className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 space-y-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-8 w-16" />
          <Bone className="h-4 w-32" />
          <Bone className="h-8 w-16" />
        </div>
        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 flex items-center justify-center">
          <Bone className="h-32 w-32 rounded-xl" />
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 space-y-4">
        <Bone className="h-4 w-24" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="size-8 rounded-full shrink-0" />
            <Bone className="h-4 flex-1" />
            <Bone className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
