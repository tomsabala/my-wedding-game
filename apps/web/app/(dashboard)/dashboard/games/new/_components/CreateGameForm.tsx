'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { createGameSchema, type CreateGameInput } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createGame } from '@/app/actions/games'

export default function CreateGameForm() {
  const t = useTranslations('dashboard.createForm')
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGameInput>({ resolver: zodResolver(createGameSchema) })

  async function onSubmit(data: CreateGameInput) {
    setServerError(null)
    const result = await createGame(data)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    router.push(`/dashboard/games/${result.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="coupleNames">{t('coupleNames')}</Label>
        <Input
          id="coupleNames"
          type="text"
          placeholder={t('coupleNamesPlaceholder')}
          aria-invalid={!!errors.coupleNames}
          {...register('coupleNames')}
        />
        {errors.coupleNames && (
          <p className="text-xs text-destructive">{t('errors.coupleNamesRequired')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="weddingDate">{t('weddingDate')}</Label>
        <Input
          id="weddingDate"
          type="date"
          aria-invalid={!!errors.weddingDate}
          {...register('weddingDate')}
        />
        {errors.weddingDate && (
          <p className="text-xs text-destructive">{t('errors.weddingDateRequired')}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tagline">{t('tagline')}</Label>
        <Input
          id="tagline"
          type="text"
          placeholder={t('taglinePlaceholder')}
          aria-invalid={!!errors.tagline}
          {...register('tagline')}
        />
        {errors.tagline && (
          <p className="text-xs text-destructive">{t('errors.taglineTooLong')}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="ml-2 size-4 animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  )
}
