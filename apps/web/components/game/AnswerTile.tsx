'use client'

type Props = {
  label: string
  text: string
  selected: boolean
  locked: boolean
  isCorrect: boolean
  isWrong: boolean
  pending: boolean
  onClick: () => void
}

export default function AnswerTile({
  label,
  text,
  selected,
  locked,
  isCorrect,
  isWrong,
  pending,
  onClick,
}: Props) {
  let stateClass = 'border-wedding-outline-variant bg-wedding-surface'
  if (isCorrect) {
    stateClass = 'border-emerald-500 bg-emerald-50'
  } else if (isWrong) {
    stateClass = 'border-rose-400 bg-rose-50'
  } else if (pending) {
    stateClass = 'border-wedding-tertiary bg-[#fffdf0] animate-pulse'
  } else if (selected && !locked) {
    stateClass = 'border-wedding-tertiary bg-[#fffdf0]'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-right transition-all min-h-[64px] ${stateClass} ${
        !locked ? 'hover:border-wedding-tertiary hover:shadow-sm cursor-pointer' : ''
      } ${locked ? 'cursor-default' : ''}`}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-wedding-secondary-container text-sm font-bold text-wedding-secondary">
        {label}
      </span>
      <span className="text-sm sm:text-base text-wedding-on-surface text-right flex-1">{text}</span>
    </button>
  )
}
