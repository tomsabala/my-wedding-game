'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { calculateQuestionScore, shuffleArray } from '@repo/shared'
import type { PassingCardType, CardLayout } from '@repo/shared'
import { Button } from '@/components/ui/button'
import AnswerTile from '@/components/game/AnswerTile'
import CardLayoutRenderer from '@/components/CardLayoutRenderer'

const FEEDBACK_DELAY_MS = 700

type PreviewQuestion = {
  id: string
  text: string
  options: string[]
  correctIndex: number
  position: number
}

type PreviewCard = {
  id: string
  type: PassingCardType
  content: string
  layout?: CardLayout | null
  afterQuestionPosition: number | null
}

export type PreviewGame = {
  id: string
  coupleNames: string
  questions: PreviewQuestion[]
  passingCards: PreviewCard[]
}

type Screen =
  | { type: 'question'; index: number }
  | { type: 'interstitial'; card: PreviewCard; nextIndex: number }
  | { type: 'done'; totalScore: number; correctCount: number }

// ─── Root component ──────────────────────────────────────────────────────────

export default function PreviewPlayer({ game }: { game: PreviewGame }) {
  const t = useTranslations('dashboard.preview')
  const tGame = useTranslations('game')

  const questions = game.questions

  const [screen, setScreen] = useState<Screen>({ type: 'question', index: 0 })
  const [totalScore, setTotalScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [shownCardIds, setShownCardIds] = useState<string[]>([])

  const restart = useCallback(() => {
    setScreen({ type: 'question', index: 0 })
    setTotalScore(0)
    setCorrectCount(0)
    setShownCardIds([])
  }, [])

  const advanceFromQuestion = useCallback(
    (
      newScore: number,
      newCorrectCount: number,
      justAnsweredPosition: number,
      currentShownIds: string[],
      currentIndex: number,
    ) => {
      const nextIndex = currentIndex + 1
      const isLastQuestion = nextIndex >= questions.length

      const unshown = (c: PreviewCard) => !currentShownIds.includes(c.id)
      const pendingCard =
        game.passingCards.find(
          (c) => unshown(c) && c.afterQuestionPosition === justAnsweredPosition,
        ) ??
        (isLastQuestion
          ? game.passingCards.find((c) => unshown(c) && c.afterQuestionPosition === null)
          : undefined)

      if (pendingCard) {
        setShownCardIds([...currentShownIds, pendingCard.id])
        setTotalScore(newScore)
        setCorrectCount(newCorrectCount)
        setScreen({ type: 'interstitial', card: pendingCard, nextIndex })
        return
      }

      if (isLastQuestion) {
        setScreen({ type: 'done', totalScore: newScore, correctCount: newCorrectCount })
        return
      }

      setTotalScore(newScore)
      setCorrectCount(newCorrectCount)
      setScreen({ type: 'question', index: nextIndex })
    },
    [game.passingCards, questions],
  )

  const continueFromInterstitial = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= questions.length) {
        setScreen({ type: 'done', totalScore, correctCount })
      } else {
        setScreen({ type: 'question', index: nextIndex })
      }
    },
    [questions.length, totalScore, correctCount],
  )

  const banner = (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 h-10 bg-wedding-primary-container border-b border-wedding-outline-variant">
      <span className="text-xs font-semibold text-wedding-primary">{t('banner')}</span>
      <Link
        href={`/dashboard/games/${game.id}`}
        className="flex items-center gap-1 text-xs font-medium text-wedding-on-surface-variant hover:text-wedding-primary transition-colors"
      >
        {t('exit')}
        <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
          close
        </span>
      </Link>
    </div>
  )

  if (questions.length === 0) {
    return (
      <main dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        {banner}
        <span
          className="material-symbols-rounded text-wedding-outline"
          style={{ fontSize: '56px', lineHeight: 1 }}
        >
          quiz
        </span>
        <p className="text-sm text-wedding-on-surface-variant text-center">{t('noQuestions')}</p>
        <Link href={`/dashboard/games/${game.id}`}>
          <Button variant="outline">{t('back')}</Button>
        </Link>
      </main>
    )
  }

  if (screen.type === 'interstitial') {
    return (
      <>
        {banner}
        <main dir="rtl" className="min-h-screen bg-wedding-bg flex flex-col pt-10">
          <InterstitialScreen
            card={screen.card}
            onContinue={() => continueFromInterstitial(screen.nextIndex)}
          />
        </main>
      </>
    )
  }

  if (screen.type === 'done') {
    return (
      <>
        {banner}
        <main
          dir="rtl"
          className="min-h-screen bg-wedding-bg flex flex-col items-center justify-center pt-10 px-6"
        >
          <DoneScreen
            gameId={game.id}
            totalScore={screen.totalScore}
            correctCount={screen.correctCount}
            totalQuestions={questions.length}
            onRestart={restart}
          />
        </main>
      </>
    )
  }

  const currentQuestion = questions[screen.index]!
  const currentIndex = screen.index

  return (
    <>
      {banner}
      <main dir="rtl" className="min-h-screen bg-wedding-bg flex flex-col pt-10">
        <header className="px-6 py-4 flex items-center justify-between border-b border-wedding-outline-variant bg-wedding-surface">
          <span className="font-serif text-base font-semibold text-wedding-primary">
            {game.coupleNames}
          </span>
          <span className="text-sm font-semibold text-wedding-on-surface">
            {tGame('score', { score: totalScore })}
          </span>
        </header>

        <QuestionScreen
          key={currentQuestion.id}
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onComplete={(scoreGained, isCorrect) =>
            advanceFromQuestion(
              totalScore + scoreGained,
              correctCount + (isCorrect ? 1 : 0),
              currentQuestion.position,
              shownCardIds,
              currentIndex,
            )
          }
        />
      </main>
    </>
  )
}

// ─── Question screen ─────────────────────────────────────────────────────────

function QuestionScreen({
  question,
  questionNumber,
  totalQuestions,
  onComplete,
}: {
  question: PreviewQuestion
  questionNumber: number
  totalQuestions: number
  onComplete: (scoreGained: number, isCorrect: boolean) => void
}) {
  const t = useTranslations('game')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<{ isCorrect: boolean } | null>(null)
  const startedAtRef = useRef<number>(0)

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [])

  const optionLabels = useMemo(
    () => [t('answerA'), t('answerB'), t('answerC'), t('answerD'), t('answerE')],
    [t],
  )

  const { shuffledOptions, shuffledCorrectIndex } = useMemo(() => {
    const order = shuffleArray(question.options.map((_, i) => i))
    return {
      shuffledOptions: order.map((i) => question.options[i]!),
      shuffledCorrectIndex: order.indexOf(question.correctIndex),
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- component is keyed per question

  const handleLock = useCallback(
    (idx: number) => {
      if (locked) return
      setLocked(true)
      setSelectedIndex(idx)
      const timeTakenMs = startedAtRef.current === 0 ? 0 : Date.now() - startedAtRef.current
      const isCorrect = idx === shuffledCorrectIndex
      const scoreGained = calculateQuestionScore(isCorrect, timeTakenMs)
      setResult({ isCorrect })
      setTimeout(() => onComplete(scoreGained, isCorrect), FEEDBACK_DELAY_MS)
    },
    [locked, shuffledCorrectIndex, onComplete],
  )

  return (
    <div className="flex-1 px-5 py-6 max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div className="text-xs text-wedding-on-surface-variant">
        <span>{t('question', { current: questionNumber, total: totalQuestions })}</span>
      </div>

      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-wedding-on-surface leading-snug">
          {question.text}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shuffledOptions.map((option, i) => (
          <AnswerTile
            key={i}
            label={optionLabels[i] ?? ''}
            text={option}
            selected={selectedIndex === i}
            locked={locked}
            isCorrect={locked && i === shuffledCorrectIndex}
            isWrong={locked && !!result && !result.isCorrect && selectedIndex === i}
            pending={locked && !result && selectedIndex === i}
            onClick={() => setSelectedIndex(i)}
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

// ─── Interstitial (passing card) screen ──────────────────────────────────────

function InterstitialScreen({
  card,
  onContinue,
}: {
  card: PreviewCard
  onContinue: () => void
}) {
  const t = useTranslations('game')
  const chapter = card.afterQuestionPosition !== null ? card.afterQuestionPosition + 1 : null

  return (
    <div className="flex-1 px-6 py-10 max-w-2xl w-full mx-auto flex flex-col">
      {chapter !== null && (
        <p className="text-xs font-semibold uppercase tracking-wider text-wedding-on-surface-variant">
          {t('chapter', { n: chapter })}
        </p>
      )}

      <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-wedding-primary">
        {card.type === 'DID_YOU_KNOW' ? t('didYouKnow') : t('aMoment')}
      </h1>

      {card.layout ? (
        <CardLayoutRenderer
          layout={card.layout}
          className="relative overflow-hidden mt-6 rounded-3xl flex-1"
          style={{ aspectRatio: '9/16', maxHeight: '65vh' }}
        />
      ) : (
        <div className="mt-6 rounded-3xl bg-wedding-surface border border-wedding-outline-variant p-6 flex-1 flex flex-col gap-4">
          {card.type === 'DID_YOU_KNOW' ? (
            <div className="flex items-center justify-center pt-4">
              <span
                className="material-symbols-rounded text-wedding-tertiary"
                style={{ fontSize: '56px', lineHeight: 1 }}
              >
                lightbulb
              </span>
            </div>
          ) : (
            <div className="aspect-video bg-wedding-surface-container rounded-2xl flex items-center justify-center">
              <span
                className="material-symbols-rounded text-wedding-outline"
                style={{ fontSize: '48px', lineHeight: 1 }}
              >
                {card.type === 'PHOTO' ? 'image' : 'movie'}
              </span>
            </div>
          )}
          <p className="font-serif text-lg sm:text-xl text-wedding-on-surface leading-relaxed text-center">
            {card.content}
          </p>
        </div>
      )}

      <Button onClick={onContinue} className="mt-6 mx-auto">
        {t('nextQuestion')}
        <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
          arrow_back
        </span>
      </Button>
    </div>
  )
}

// ─── Done screen ─────────────────────────────────────────────────────────────

function DoneScreen({
  gameId,
  totalScore,
  correctCount,
  totalQuestions,
  onRestart,
}: {
  gameId: string
  totalScore: number
  correctCount: number
  totalQuestions: number
  onRestart: () => void
}) {
  const t = useTranslations('dashboard.preview')

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
      <span
        className="material-symbols-rounded text-wedding-tertiary"
        style={{ fontSize: '64px', lineHeight: 1 }}
      >
        celebration
      </span>
      <h1 className="font-serif text-3xl font-bold text-wedding-primary">{t('done')}</h1>
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 w-full space-y-2">
        <p className="text-2xl font-bold text-wedding-on-surface">
          {t('yourScore', { score: totalScore })}
        </p>
        <p className="text-sm text-wedding-on-surface-variant">
          {t('correctAnswers', { correct: correctCount, total: totalQuestions })}
        </p>
      </div>
      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1" onClick={onRestart}>
          {t('restart')}
        </Button>
        <Link href={`/dashboard/games/${gameId}`} className="flex-1">
          <Button className="w-full">{t('back')}</Button>
        </Link>
      </div>
    </div>
  )
}
