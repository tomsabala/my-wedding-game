'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { deployGame, undeployGame } from '@/app/actions/games'
import QRCodeSection from './QRCodeSection'
import type { GameStatus } from '@repo/db'

type Props = {
  game: {
    id: string
    slug: string
    status: GameStatus
    _count: { questions: number }
  }
}

export default function DeploySection({ game }: Props) {
  const t = useTranslations('dashboard.deploy')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/${game.slug}` : `/${game.slug}`

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

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <section className="rounded-lg border p-5 space-y-4">
      {game.status === 'DRAFT' ? (
        <>
          <div>
            <h3 className="font-medium mb-1">פרסום המשחק</h3>
            <p className="text-sm text-muted-foreground">
              פרסם את המשחק כדי לקבל קישור ו-QR לשיתוף עם האורחים.
              {game._count.questions < 3 && (
                <span className="block mt-1 text-amber-600">
                  חסרות שאלות — נדרשות לפחות 3 כדי לפרסם.
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleDeploy} disabled={isPending}>
            {isPending && <Loader2 className="ml-2 size-4 animate-spin" />}
            {t('button')}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="outline" onClick={handleUndeploy} disabled={isPending}>
              {isPending && <Loader2 className="ml-2 size-4 animate-spin" />}
              {t('undeploy')}
            </Button>
            <Button variant="outline" onClick={copyLink}>
              {copied ? t('linkCopied') : t('copyLink')}
            </Button>
            <Link href={`/preview/${game.id}`} target="_blank">
              <Button variant="outline">{t('preview')}</Button>
            </Link>
          </div>

          <div className="text-sm text-muted-foreground break-all">{shareUrl}</div>

          <QRCodeSection slug={game.slug} />
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </section>
  )
}
