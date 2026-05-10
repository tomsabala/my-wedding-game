'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { deployGame, undeployGame } from '@/app/actions/games'
import type { GameStatus } from '@repo/db'

type Props = {
  game: {
    id: string
    status: GameStatus
    _count: { questions: number }
  }
}

export default function DeploySection({ game }: Props) {
  const t = useTranslations('dashboard.deploy')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col items-end gap-2">
      {game.status === 'DRAFT' ? (
        <>
          {game._count.questions < 3 && (
            <p className="text-xs text-amber-600 text-end">נדרשות לפחות 3 שאלות לפרסום</p>
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
      {error && <p className="text-xs text-destructive text-end">{error}</p>}
    </div>
  )
}
