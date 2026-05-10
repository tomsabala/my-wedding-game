const QUESTION_TARGET = 40

type Props = {
  questionCount: number
  playerCount: number
}

export default function GameStats({ questionCount, playerCount }: Props) {
  const pct = Math.min(Math.round((questionCount / QUESTION_TARGET) * 100), 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-rounded text-wedding-primary"
          style={{ fontSize: '28px', lineHeight: 1 }}
        >
          quiz
        </span>
        <div>
          <p className="text-2xl font-bold text-wedding-on-surface">{questionCount}</p>
          <p className="text-xs text-wedding-on-surface-variant">שאלות</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-wedding-on-surface-variant mb-1.5">
          <span>התקדמות לעבר {QUESTION_TARGET} שאלות</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-wedding-surface-container overflow-hidden">
          <div
            className="h-full rounded-full bg-wedding-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {playerCount > 0 && (
        <p className="text-xs text-wedding-on-surface-variant border-t border-wedding-outline-variant pt-3">
          {playerCount} שחקנים הצטרפו עד כה
        </p>
      )}
    </div>
  )
}
