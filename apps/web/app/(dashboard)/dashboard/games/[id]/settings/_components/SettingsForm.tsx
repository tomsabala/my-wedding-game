'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { createGameSchema, type CreateGameInput } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateGame, deleteGame } from '@/app/actions/games'

type Props = {
  game: {
    id: string
    coupleNames: string
    weddingDate: string
    tagline: string | null
  }
}

export default function SettingsForm({ game }: Props) {
  const t = useTranslations('settings')
  const tForm = useTranslations('dashboard.createForm')
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateGameInput>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      coupleNames: game.coupleNames,
      weddingDate: game.weddingDate,
      tagline: game.tagline ?? '',
    },
  })

  async function onSubmit(data: CreateGameInput) {
    setServerError(null)
    const result = await updateGame(game.id, data)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  function onDelete() {
    setServerError(null)
    startDelete(async () => {
      const result = await deleteGame(game.id)
      if (!result.success) {
        setServerError(result.error)
        return
      }
      router.push('/dashboard')
    })
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 space-y-5"
      >
        <div>
          <h1 className="font-serif text-xl font-semibold text-wedding-on-surface">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-wedding-on-surface-variant">{t('subtitle')}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coupleNames">{tForm('coupleNames')}</Label>
          <Input
            id="coupleNames"
            type="text"
            placeholder={tForm('coupleNamesPlaceholder')}
            aria-invalid={!!errors.coupleNames}
            {...register('coupleNames')}
          />
          {errors.coupleNames && (
            <p className="text-xs text-destructive">{tForm('errors.coupleNamesRequired')}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weddingDate">{tForm('weddingDate')}</Label>
          <Input
            id="weddingDate"
            type="date"
            aria-invalid={!!errors.weddingDate}
            {...register('weddingDate')}
          />
          {errors.weddingDate && (
            <p className="text-xs text-destructive">{tForm('errors.weddingDateRequired')}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tagline">{tForm('tagline')}</Label>
          <Input
            id="tagline"
            type="text"
            placeholder={tForm('taglinePlaceholder')}
            aria-invalid={!!errors.tagline}
            {...register('tagline')}
          />
          {errors.tagline && (
            <p className="text-xs text-destructive">{tForm('errors.taglineTooLong')}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex items-center justify-between gap-3 pt-2">
          {saved && (
            <span className="text-xs text-wedding-on-surface-variant">{t('saved')}</span>
          )}
          <Button type="submit" disabled={isSubmitting || !isDirty} className="ms-auto">
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </form>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-wedding-surface border border-destructive/30 p-6 space-y-3">
        <h2 className="text-sm font-semibold text-destructive">{t('dangerZone')}</h2>
        <p className="text-sm text-wedding-on-surface-variant">{t('deleteDescription')}</p>

        {confirmDelete ? (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-wedding-on-surface">{t('deleteConfirm')}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              {t('deleteConfirmYes')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              {t('deleteConfirmNo')}
            </Button>
          </div>
        ) : (
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
              delete
            </span>
            {t('delete')}
          </Button>
        )}
      </div>
    </div>
  )
}
