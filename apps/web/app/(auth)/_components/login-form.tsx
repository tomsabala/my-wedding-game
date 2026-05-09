'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

import { loginSchema, type LoginInput } from '@repo/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import GoogleIcon from './google-icon'
import OrDivider from './or-divider'

export default function LoginForm() {
  const t = useTranslations('auth.login')
  const tc = useTranslations('auth.common')
  const tErr = useTranslations('auth.errors')
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setError(error.message)
      return
    }
    router.push('/dashboard')
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

  return (
    <>
      <div className="mb-6">
        <h1>{t('title')}</h1>
        <p className="mt-1">
          {t('noAccount')}{' '}
          <Link href="/signup" className="font-medium underline underline-offset-4">
            {t('signUpLink')}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{tc('password')}</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-black/60 underline underline-offset-4 hover:text-black"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {tErr(errors.password.message as Parameters<typeof tErr>[0])}
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
