function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-wedding-surface-container ${className ?? ''}`} />
}

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Bone className="h-4 w-28" />
      <Bone className="h-10 w-full rounded-xl" />
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 space-y-5">
      <Bone className="h-6 w-32" />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <div className="flex justify-end pt-2">
        <Bone className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  )
}
