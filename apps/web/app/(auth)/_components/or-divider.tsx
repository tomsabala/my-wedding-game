'use client'

import { useTranslations } from 'next-intl'

export default function OrDivider() {
  const t = useTranslations('auth.common')
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/30" />
      <span className="text-xs text-white/60">{t('or')}</span>
      <div className="h-px flex-1 bg-white/30" />
    </div>
  )
}
