function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-wedding-surface-container ${className ?? ''}`} />
}

export default function QuestionsLoading() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-1/2" />
            </div>
            <Bone className="h-8 w-8 rounded-lg shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[0, 1, 2, 3].map((j) => (
              <Bone key={j} className="h-9 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
      <Bone className="h-10 w-36 rounded-xl mx-auto" />
    </div>
  )
}
