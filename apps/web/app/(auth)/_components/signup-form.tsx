'use client'

import { useState } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { signupSchema, type SignupInput } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import GoogleIcon from './google-icon'
import OrDivider from './or-divider'
import SuccessCard from './success-card'

export default function SignupForm() {
  const t = useTranslations('auth.signup')
  const tc = useTranslations('auth.common')
  const tErr = useTranslations('auth.errors')
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(data: SignupInput) {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
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
        <p className="mt-1">
          {t('hasAccount')}{' '}
          <Link href="/login" className="font-medium underline underline-offset-4">
            {t('signInLink')}
          </Link>
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || isSubmitting}
      >
        {googleLoading ? <Loader2 className="ml-2 size-4 animate-spin" /> : <GoogleIcon />}
        {tc('continueWithGoogle')}
      </Button>

      <OrDivider />

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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{tc('password')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {tErr(errors.password.message as Parameters<typeof tErr>[0])}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {tErr(errors.confirmPassword.message as Parameters<typeof tErr>[0])}
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting || googleLoading}>
          {isSubmitting && <Loader2 className="ml-2 size-4 animate-spin" />}
          {t('submit')}
        </Button>
      </form>
    </>
  )
}
