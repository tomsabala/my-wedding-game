'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function ExitGameModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('game')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6">
        <h2 className="font-serif text-xl font-semibold text-wedding-on-surface">
          {t('exitWarningTitle')}
        </h2>
        <p className="mt-2 text-sm text-wedding-on-surface-variant">{t('exitWarningBody')}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {t('exitCancel')}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {t('exitConfirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
