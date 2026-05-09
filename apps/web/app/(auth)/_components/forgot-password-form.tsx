'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { forgotPasswordSchema, type ForgotPasswordInput } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import SuccessCard from './success-card'

export default function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword')
  const tc = useTranslations('auth.common')
  const tErr = useTranslations('auth.errors')
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordInput) {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <SuccessCard
        title={t('successTitle')}
        message={t('successMessage')}
        backHref="/login"
        backLabel={tc('backToSignIn')}
      />
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1>{t('title')}</h1>
        <p className="mt-1">{t('description')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{tc('email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={tc('emailPlaceholder')}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">
              {tErr(errors.email.message as Parameters<typeof tErr>[0])}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="ml-2 size-4 animate-spin" />}
          {t('submit')}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm underline underline-offset-4">
          {tc('backToSignIn')}
        </Link>
      </div>
    </>
  )
}
