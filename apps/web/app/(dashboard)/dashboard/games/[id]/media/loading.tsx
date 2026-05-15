function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-wedding-surface-container ${className ?? ''}`} />
}

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      {/* Storage quota bar */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5 space-y-3">
        <div className="flex justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-2 w-full rounded-full" />
      </div>

      {/* Upload button */}
      <Bone className="h-10 w-36 rounded-xl" />

      {/* Media grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Bone key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
