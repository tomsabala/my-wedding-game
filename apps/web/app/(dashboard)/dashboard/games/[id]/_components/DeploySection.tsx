'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { deployGame, undeployGame, resetGame } from '@/app/actions/games'
import type { GameStatus } from '@repo/db'

type Props = {
  game: {
    id: string
    status: GameStatus
    _count: { questions: number; players: number }
  }
}

export default function DeploySection({ game }: Props) {
  const t = useTranslations('dashboard.deploy')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleDeploy() {
    setError(null)
    startTransition(async () => {
      const result = await deployGame(game.id)
      if (!result.success) setError(result.error)
    })
  }

  function handleUndeploy() {
    setError(null)
    startTransition(async () => {
      const result = await undeployGame(game.id)
      if (!result.success) setError(result.error)
    })
  }

  function handleReset() {
    setError(null)
    setConfirmReset(false)
    startTransition(async () => {
      const result = await resetGame(game.id)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Link href={`/preview/${game.id}`}>
        <Button variant="outline" size="sm">
          <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
            preview
          </span>
          {t('preview')}
        </Button>
      </Link>
      {game.status === 'DRAFT' ? (
        <>
          {game._count.questions < 3 && (
            <p className="text-xs text-amber-600 text-end">{t('notEnoughQuestions')}</p>
          )}
          <Button onClick={handleDeploy} disabled={isPending || game._count.questions < 3}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
                rocket_launch
              </span>
            )}
            {t('button')}
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={handleUndeploy} disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t('undeploy')}
        </Button>
      )}
      {game.status === 'DRAFT' && game._count.players > 0 && (
        confirmReset ? (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-destructive text-end">{t('resetConfirm')}</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmReset(false)}
                disabled={isPending}
              >
                {t('resetCancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('resetConfirmButton')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmReset(true)}
            disabled={isPending}
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
              restart_alt
            </span>
            {t('reset')}
          </Button>
        )
      )}
      {error && <p className="text-xs text-destructive text-end">{error}</p>}
    </div>
  )
}
