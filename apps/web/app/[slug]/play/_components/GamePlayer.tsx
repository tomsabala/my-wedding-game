'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { submitAnswer, finishGame, type PlayGame } from '@/app/actions/players'
import { shuffleArray } from '@repo/shared'
import {
  clearProgress,
  readPlayer,
  readProgress,
  writeProgress,
  type StoredPlayer,
  type StoredProgress,
} from '@/lib/player-storage'
import AnswerTile from '@/components/game/AnswerTile'
import GameNav from './GameNav'

const FEEDBACK_DELAY_MS = 700

type Bootstrap = {
  player: StoredPlayer
  initialIndex: number
  initialScore: number
  initialShown: string[]
}

// ─── Outer: load player + saved progress from localStorage ──────────────────

export default function GamePlayer({ game }: { game: PlayGame }) {
  const router = useRouter()
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)

  useEffect(() => {
    let cancelled = false

    // Defer to a microtask so the setState is async w.r.t. the effect body
    queueMicrotask(() => {
      if (cancelled) return
      const player = readPlayer()
      if (!player || player.slug !== game.slug) {
        router.replace(`/${game.slug}`)
        return
      }

      const progress = readProgress()
      const matchingProgress = progress && progress.slug === game.slug ? progress : null

      setBootstrap({
        player,
        initialIndex: matchingProgress?.currentIndex ?? 0,
        initialScore: matchingProgress?.totalScore ?? 0,
        initialShown: matchingProgress?.shownCardIds ?? [],
      })
    })

    return () => {
      cancelled = true
    }
  }, [game.slug, router])

  if (!bootstrap) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-wedding-bg">
        <Loader2 className="size-6 animate-spin text-wedding-primary" />
      </main>
    )
  }

  return <ActiveGame game={game} bootstrap={bootstrap} />
}

// ─── Active game (mounted only after bootstrap is ready) ─────────────────────

function ActiveGame({ game, bootstrap }: { game: PlayGame; bootstrap: Bootstrap }) {
  const t = useTranslations('game')
  const router = useRouter()

  const [currentIndex, setCurrentIndex] = useState(bootstrap.initialIndex)
  const [totalScore, setTotalScore] = useState(bootstrap.initialScore)
  const [shownCardIds, setShownCardIds] = useState<string[]>(bootstrap.initialShown)
  const [finishing, setFinishing] = useState(false)

  const [questions] = useState(() => shuffleArray(game.questions))

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  const finalize = useCallback(
    async () => {
      setFinishing(true)
      await finishGame(bootstrap.player.playerId)
      clearProgress()
      router.replace(`/${game.slug}/leaderboard`)
    },
    [bootstrap.player.playerId, game.slug, router],
  )

  const advanceAfterAnswer = useCallback(
    (newTotalScore: number, justAnsweredPosition: number, currentShown: string[]) => {
      const nextIndex = currentIndex + 1
      const isLastQuestion = nextIndex >= totalQuestions

      // Prefer a card placed directly after this question; if none and this was
      // the last question, fall back to an end-of-game card.
      const unshown = (c: { id: string }) => !currentShown.includes(c.id)
      const pendingCard =
        game.passingCards.find((c) => unshown(c) && c.afterQuestionPosition === justAnsweredPosition) ??
        (isLastQuestion
          ? game.passingCards.find((c) => unshown(c) && c.afterQuestionPosition === null)
          : undefined)

      const progressBase: Omit<StoredProgress, 'currentIndex' | 'shownCardIds'> = {
        slug: game.slug,
        totalScore: newTotalScore,
      }

      if (pendingCard) {
        writeProgress({
          ...progressBase,
          currentIndex: nextIndex,
          shownCardIds: [...currentShown, pendingCard.id],
        })
        router.push(`/${game.slug}/interstitial?cardId=${pendingCard.id}`)
        return
      }

      if (isLastQuestion) {
        void finalize()
        return
      }

      writeProgress({
        ...progressBase,
        currentIndex: nextIndex,
        shownCardIds: currentShown,
      })
      setCurrentIndex(nextIndex)
      setTotalScore(newTotalScore)
      setShownCardIds(currentShown)
    },
    [currentIndex, game, totalQuestions, router, finalize],
  )

  if (finishing || !currentQuestion) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-wedding-bg">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-6 animate-spin text-wedding-primary" />
          <p className="text-sm text-wedding-on-surface-variant">{t('finalizing')}</p>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-wedding-bg flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-wedding-outline-variant bg-wedding-surface">
        <span className="font-serif text-base font-semibold text-wedding-primary">
          {game.coupleNames}
        </span>
        <span className="text-sm font-semibold text-wedding-on-surface">
          {t('score', { score: totalScore })}
        </span>
      </header>

      <QuestionRound
        key={currentQuestion.id}
        playerId={bootstrap.player.playerId}
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={totalQuestions}
        onComplete={(scoreGained) =>
          advanceAfterAnswer(totalScore + scoreGained, currentQuestion.position, shownCardIds)
        }
      />

      <GameNav slug={game.slug} active="play" />
    </main>
  )
}

// ─── One question round (remounts via key on each question) ──────────────────

function QuestionRound({
  playerId,
  question,
  questionNumber,
  totalQuestions,
  onComplete,
}: {
  playerId: string
  question: PlayGame['questions'][number]
  questionNumber: number
  totalQuestions: number
  onComplete: (scoreGained: number) => void
}) {
  const t = useTranslations('game')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; correctIndex: number } | null>(
    null,
  )
  const startedAtRef = useRef<number>(0)

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  const optionLabels = useMemo(
    () => [t('answerA'), t('answerB'), t('answerC'), t('answerD'), t('answerE')],
    [t],
  )

  const handleLock = useCallback(
    async (idx: number) => {
      if (locked) return
      setLocked(true)
      setSelectedIndex(idx)
      const timeTakenMs = startedAtRef.current === 0 ? 0 : Date.now() - startedAtRef.current

      const result = await submitAnswer({
        playerId,
        questionId: question.id,
        selectedIndex: idx,
        timeTakenMs,
      })

      const scoreGained = result.success ? result.data.questionScore : 0
      const isCorrect = result.success ? result.data.isCorrect : false
      setLastResult({ isCorrect, correctIndex: isCorrect ? idx : -1 })
      setTimeout(() => onComplete(scoreGained), FEEDBACK_DELAY_MS)
    },
    [locked, playerId, question.id, onComplete],
  )

  return (
    <div className="flex-1 px-5 py-6 max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-wedding-on-surface-variant">
        <span>{t('question', { current: questionNumber, total: totalQuestions })}</span>
      </div>

      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-wedding-on-surface leading-snug">
          {question.text}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, i) => (
          <AnswerTile
            key={i}
            label={optionLabels[i] ?? ''}
            text={option}
            selected={selectedIndex === i}
            locked={locked}
            isCorrect={locked && lastResult ? i === lastResult.correctIndex : false}
            isWrong={
              locked && lastResult ? !lastResult.isCorrect && selectedIndex === i : false
            }
            onClick={() => !locked && setSelectedIndex(i)}
          />
        ))}
      </div>

      <Button
        onClick={() => selectedIndex !== null && handleLock(selectedIndex)}
        disabled={selectedIndex === null || locked}
        className="self-end"
      >
        {t('lockAnswer')}
      </Button>
    </div>
  )
}
