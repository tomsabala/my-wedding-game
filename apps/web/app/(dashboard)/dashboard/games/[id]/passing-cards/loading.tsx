function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-wedding-surface-container ${className ?? ''}`} />
}

export default function PassingCardsLoading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5"
        >
          <div className="flex items-center gap-4">
            <Bone className="size-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-48" />
            </div>
            <Bone className="h-8 w-16 rounded-xl shrink-0" />
          </div>
        </div>
      ))}
      <Bone className="h-10 w-40 rounded-xl mx-auto" />
    </div>
  )
}
