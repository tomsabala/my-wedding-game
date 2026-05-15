'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinGame } from '@/app/actions/players'
import { writePlayer, clearAll } from '@/lib/player-storage'

export default function JoinGameForm({ slug }: { slug: string }) {
  const t = useTranslations('player')
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    clearAll()
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('errors.nameRequired'))
      return
    }
    startTransition(async () => {
      const result = await joinGame(slug, name)
      if (!result.success) {
        setError(result.error === 'nameTaken' ? t('errors.nameTaken') : result.error)
        return
      }
      writePlayer({ playerId: result.data.playerId, gameId: result.data.gameId, slug })
      router.push(`/${slug}/play`)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="player-name">{t('yourName')}</Label>
        <Input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder={t('namePlaceholder')}
          autoFocus
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
            play_circle
          </span>
        )}
        {t('startPlaying')}
      </Button>
    </form>
  )
}
