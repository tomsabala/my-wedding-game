'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { submitAnswer, finishGame, getPassingCard, getGameForPlay, type PlayGame } from '@/app/actions/players'
import { shuffleArray, calculateQuestionScore, type CardLayout } from '@repo/shared'
import {
  clearAll,
  clearProgress,
  readPlayer,
  readProgress,
  writeProgress,
  type StoredPlayer,
  type StoredProgress,
} from '@/lib/player-storage'
import { useBackPrevention } from '@/lib/useBackPrevention'
import { ExitGameModal } from '@/components/game/ExitGameModal'
import AnswerTile from '@/components/game/AnswerTile'
import CardLayoutRenderer from '@/components/CardLayoutRenderer'

type Bootstrap = {
  game: PlayGame
  player: StoredPlayer
  initialIndex: number
  initialScore: number
  initialShown: string[]
}

function extractImageUrls(layout: CardLayout): string[] {
  const urls: string[] = []
  if (layout.background.type === 'image' && layout.background.imageUrl) {
    urls.push(layout.background.imageUrl)
  }
  for (const el of layout.elements) {
    if (el.type === 'image') urls.push(el.url)
  }
  return urls
}

function preloadImages(urls: string[], onReady: () => void) {
  if (urls.length === 0) { onReady(); return }
  let remaining = urls.length
  const done = () => { if (--remaining === 0) onReady() }
  for (const url of urls) {
    const img = new Image()
    img.src = url
    if (img.complete) { done(); continue }
    img.onload = done
    img.onerror = done
  }
}

// ─── Outer: load player + saved progress from localStorage ──────────────────

export default function GamePlayer({ slug }: { slug: string }) {
  const router = useRouter()
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const player = readPlayer()
      if (!player || player.slug !== slug) {
        router.replace(`/${slug}`)
        return
      }

      const game = await getGameForPlay(slug)
      if (cancelled) return
      if (!game) {
        router.replace(`/${slug}`)
        return
      }

      const progress = readProgress()
      const matchingProgress = progress?.slug === slug ? progress : null

      setBootstrap({
        game,
        player,
        initialIndex: matchingProgress?.currentIndex ?? 0,
        initialScore: matchingProgress?.totalScore ?? 0,
        initialShown: matchingProgress?.shownCardIds ?? [],
      })
    })()

    return () => {
      cancelled = true
    }
  }, [slug, router])

  if (!bootstrap) {
    return (
      <main dir="rtl" className="fixed inset-0 flex items-center justify-center bg-wedding-bg">
        <Loader2 className="size-6 animate-spin text-wedding-primary" />
      </main>
    )
  }

  return <ActiveGame game={bootstrap.game} bootstrap={bootstrap} />
}

// ─── Active game (mounted only after bootstrap is ready) ─────────────────────

function ActiveGame({ game, bootstrap }: { game: PlayGame; bootstrap: Bootstrap }) {
  const t = useTranslations('game')
  const router = useRouter()

  const [currentIndex, setCurrentIndex] = useState(bootstrap.initialIndex)
  const [totalScore, setTotalScore] = useState(bootstrap.initialScore)
  const [correctCount, setCorrectCount] = useState(0)
  const [shownCardIds, setShownCardIds] = useState<string[]>(bootstrap.initialShown)
  const [finishing, setFinishing] = useState(false)
  const [finished, setFinished] = useState<{ totalScore: number; correctCount: number } | null>(null)
  const [showExitModal, setShowExitModal] = useState(false)
  const [currentCard, setCurrentCard] = useState<PlayGame['passingCards'][number] | null>(null)
  const [cardReady, setCardReady] = useState(false)
  const pendingAdvanceRef = useRef<(() => void) | null>(null)

  useBackPrevention(() => setShowExitModal(true))


  const questions = game.questions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  function handleConfirmExit() {
    clearAll()
    router.replace(`/${game.slug}`)
  }

  const finalize = useCallback(
    async (finalScore: number, finalCorrectCount: number) => {
      setFinishing(true)
      await finishGame(bootstrap.player.playerId)
      clearProgress()
      setFinished({ totalScore: finalScore, correctCount: finalCorrectCount })
    },
    [bootstrap.player.playerId],
  )

  const advanceAfterAnswer = useCallback(
    (newTotalScore: number, justAnsweredPosition: number, currentShown: string[], isCorrect: boolean) => {
      const nextIndex = currentIndex + 1
      const isLastQuestion = nextIndex >= totalQuestions
      const newCorrectCount = correctCount + (isCorrect ? 1 : 0)

      const unshown = (c: { id: string }) => !currentShown.includes(c.id)
      // Passing cards gated out — flip (false as boolean) to true to re-enable
      const pendingCard: PlayGame['passingCards'][number] | undefined =
        (false as boolean)
          ? (game.passingCards.find((c) => unshown(c) && c.afterQuestionPosition === justAnsweredPosition) ??
             (isLastQuestion ? game.passingCards.find((c) => unshown(c) && c.afterQuestionPosition === null) : undefined))
          : undefined

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

        pendingAdvanceRef.current = isLastQuestion
          ? () => { void finalize(newTotalScore, newCorrectCount) }
          : () => {
              setCurrentIndex(nextIndex)
              setTotalScore(newTotalScore)
              setCorrectCount(newCorrectCount)
              setShownCardIds([...currentShown, pendingCard.id])
              setCurrentCard(null)
              setCardReady(false)
            }

        setCurrentCard(pendingCard)
        setCardReady(false)

        // Fetch layout lazily then preload images — layout is not in initial RSC payload
        void getPassingCard(game.slug, pendingCard.id).then((fullCard) => {
          const card = fullCard ?? pendingCard
          setCurrentCard(card)
          const urls = card.layout ? extractImageUrls(card.layout) : []
          preloadImages(urls, () => setCardReady(true))
        })
        return
      }

      if (isLastQuestion) {
        void finalize(newTotalScore, newCorrectCount)
        return
      }

      writeProgress({
        ...progressBase,
        currentIndex: nextIndex,
        shownCardIds: currentShown,
      })
      setCurrentIndex(nextIndex)
      setTotalScore(newTotalScore)
      setCorrectCount(newCorrectCount)
      setShownCardIds(currentShown)
    },
    [currentIndex, correctCount, game, totalQuestions, finalize],
  )

  if (finished) {
    return (
      <EndScreen
        playerName={bootstrap.player.displayName}
        coupleNames={game.coupleNames}
        endMessage={game.endMessage}
        totalScore={finished.totalScore}
        correctCount={finished.correctCount}
        totalQuestions={game.questions.length}
      />
    )
  }

  if (finishing) {
    return (
      <>
        <main dir="rtl" className="fixed inset-0 flex items-center justify-center bg-wedding-bg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-wedding-primary" />
            <p className="text-sm text-wedding-on-surface-variant">{t('finalizing')}</p>
          </div>
        </main>
        {showExitModal && (
          <ExitGameModal onCancel={() => setShowExitModal(false)} onConfirm={handleConfirmExit} />
        )}
      </>
    )
  }

  if (currentCard) {
    const chapter = currentCard.afterQuestionPosition !== null
      ? currentCard.afterQuestionPosition + 1
      : null

    return (
      <>
        <main dir="rtl" className="fixed inset-0 bg-wedding-bg flex flex-col overflow-hidden">
          {!cardReady ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-wedding-primary" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-10 max-w-2xl w-full mx-auto flex flex-col">
              {chapter !== null && (
                <p className="text-xs font-semibold uppercase tracking-wider text-wedding-on-surface-variant">
                  {t('chapter', { n: chapter })}
                </p>
              )}
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-wedding-primary">
                {currentCard.type === 'DID_YOU_KNOW' ? t('didYouKnow') : t('aMoment')}
              </h1>
              {currentCard.layout ? (
                <CardLayoutRenderer
                  layout={currentCard.layout}
                  className="relative overflow-hidden mt-6 rounded-3xl flex-1"
                  style={{ aspectRatio: '9/16', maxHeight: '65vh' }}
                />
              ) : (
                <div className="mt-6 rounded-3xl bg-wedding-surface border border-wedding-outline-variant p-6 flex-1 flex flex-col gap-4">
                  {currentCard.type === 'DID_YOU_KNOW' ? (
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
                        {currentCard.type === 'PHOTO' ? 'image' : 'movie'}
                      </span>
                    </div>
                  )}
                  <p className="font-serif text-lg sm:text-xl text-wedding-on-surface leading-relaxed text-center">
                    {currentCard.content}
                  </p>
                </div>
              )}
              <Button
                onClick={() => { pendingAdvanceRef.current?.(); pendingAdvanceRef.current = null }}
                className="mt-6 mx-auto"
              >
                {t('nextQuestion')}
                <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
                  arrow_back
                </span>
              </Button>
            </div>
          )}
        </main>
        {showExitModal && (
          <ExitGameModal onCancel={() => setShowExitModal(false)} onConfirm={handleConfirmExit} />
        )}
      </>
    )
  }

  if (!currentQuestion) {
    return (
      <>
        <main dir="rtl" className="fixed inset-0 flex items-center justify-center bg-wedding-bg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-wedding-primary" />
            <p className="text-sm text-wedding-on-surface-variant">{t('finalizing')}</p>
          </div>
        </main>
        {showExitModal && (
          <ExitGameModal onCancel={() => setShowExitModal(false)} onConfirm={handleConfirmExit} />
        )}
      </>
    )
  }

  return (
    <>
      <main dir="rtl" className="fixed inset-0 bg-wedding-bg flex flex-col overflow-hidden">
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
          onComplete={(scoreGained, isCorrect) =>
            advanceAfterAnswer(totalScore + scoreGained, currentQuestion.position, shownCardIds, isCorrect)
          }
        />
      </main>

      {showExitModal && (
        <ExitGameModal onCancel={() => setShowExitModal(false)} onConfirm={handleConfirmExit} />
      )}
    </>
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
  onComplete: (scoreGained: number, isCorrect: boolean) => void
}) {
  const t = useTranslations('game')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<{
    isCorrect: boolean
    correctIndex: number
    scoreGained: number
  } | null>(null)
  const startedAtRef = useRef<number>(0)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current) }, [])

  const [shuffleOrder] = useState(() => shuffleArray(question.options.map((_, i) => i)))
  const shuffledOptions = shuffleOrder.map((i) => question.options[i]!)

  useEffect(() => {
    startedAtRef.current = Date.now()
    const clickTime = window.__nextQuestionClickTime
    if (clickTime !== undefined) {
      const elapsed = (performance.now() - clickTime).toFixed(1)
      console.log(`[perf-game] Q${questionNumber} mounted — ${elapsed}ms after next-question click`)
      window.__nextQuestionClickTime = undefined
    } else {
      console.log(`[perf-game] Q${questionNumber} mounted — first load`)
    }
  }, [])

  const optionLabels = useMemo(
    () => [t('answerA'), t('answerB'), t('answerC'), t('answerD'), t('answerE')],
    [t],
  )

  const handleLock = useCallback(
    (idx: number) => {
      if (locked) return
      setLocked(true)
      setSelectedIndex(idx)
      const timeTakenMs = startedAtRef.current === 0 ? 0 : Date.now() - startedAtRef.current

      const serverIdx = shuffleOrder[idx]!
      const isCorrect = serverIdx === question.correctIndex
      const scoreGained = calculateQuestionScore(isCorrect, timeTakenMs)
      const shuffledCorrectIndex = shuffleOrder.indexOf(question.correctIndex)

      setResult({ isCorrect, correctIndex: shuffledCorrectIndex, scoreGained })

      void submitAnswer({
        playerId,
        questionId: question.id,
        selectedIndex: serverIdx,
        timeTakenMs,
      })
    },
    [locked, playerId, question, shuffleOrder],
  )

  return (
    <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl w-full mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs text-wedding-on-surface-variant">
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
            isCorrect={locked && result ? i === result.correctIndex : false}
            isWrong={locked && result ? !result.isCorrect && selectedIndex === i : false}
            pending={false}
            onClick={() => !locked && setSelectedIndex(i)}
          />
        ))}
      </div>

      {result ? (
        <Button
          onClick={() => {
            window.__nextQuestionClickTime = performance.now()
            onComplete(result.scoreGained, result.isCorrect)
          }}
          className="self-end"
        >
          {t('nextQuestion')}
        </Button>
      ) : (
        <Button
          onClick={() => selectedIndex !== null && handleLock(selectedIndex)}
          disabled={selectedIndex === null}
          className="self-end"
        >
          {t('lockAnswer')}
        </Button>
      )}
    </div>
  )
}

// ─── End screen (shown after last question is answered) ───────────────────────

function EndScreen({
  playerName,
  coupleNames,
  endMessage,
  totalScore,
  correctCount,
  totalQuestions,
}: {
  playerName: string
  coupleNames: string
  endMessage: string | null
  totalScore: number
  correctCount: number
  totalQuestions: number
}) {
  const t = useTranslations('game')

  return (
    <main dir="rtl" className="fixed inset-0 bg-wedding-bg flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <span
          className="material-symbols-rounded text-wedding-tertiary"
          style={{ fontSize: '64px', lineHeight: 1 }}
        >
          favorite
        </span>

        <div>
          <h1 className="font-serif text-3xl font-bold text-wedding-primary">
            {t('end.heading')}
          </h1>
          <p className="mt-1 text-base text-wedding-on-surface">{playerName}</p>
        </div>

        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 w-full">
          <p className="font-serif text-5xl font-bold text-wedding-primary">{totalScore}</p>
          <p className="mt-1 text-sm text-wedding-on-surface-variant">{t('end.points')}</p>
          <p className="mt-3 text-sm font-semibold text-wedding-on-surface">
            {t('end.correctAnswers', { correct: correctCount, total: totalQuestions })}
          </p>
        </div>

        <div className="rounded-2xl bg-wedding-primary-container/50 border border-wedding-outline-variant p-5 w-full">
          <p className="font-serif text-base text-wedding-on-surface leading-relaxed">
            {endMessage
              ? endMessage.split('\n').map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))
              : t('end.thankYou')}
          </p>
          <p className="mt-3 text-sm font-semibold text-wedding-primary">— {coupleNames}</p>
        </div>
      </div>
    </main>
  )
}
