'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

import type { PassingCardType, CardLayout } from '@repo/shared'
import CardLayoutRenderer from '@/components/CardLayoutRenderer'

import { Button } from '@/components/ui/button'
import GameNav from '../../play/_components/GameNav'

type Card = {
  id: string
  type: PassingCardType
  content: string
  layout?: CardLayout | null
  afterQuestionPosition: number | null
}

export default function InterstitialClient({ slug, card }: { slug: string; card: Card }) {
  const t = useTranslations('game')
  const router = useRouter()

  const chapter =
    card.afterQuestionPosition !== null ? card.afterQuestionPosition + 1 : null

  return (
    <main dir="rtl" className="min-h-screen bg-wedding-bg flex flex-col">
      <div className="flex-1 px-6 py-10 max-w-2xl w-full mx-auto flex flex-col">
        {chapter !== null && (
          <p className="text-xs font-semibold uppercase tracking-wider text-wedding-on-surface-variant">
            {t('chapter', { n: chapter })}
          </p>
        )}

        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-wedding-primary">
          {card.type === 'DID_YOU_KNOW' ? t('didYouKnow') : t('aMoment')}
        </h1>

        {card.layout ? (
          <CardLayoutRenderer
            layout={card.layout}
            className="mt-6 rounded-3xl flex-1"
            style={{ aspectRatio: '9/16', maxHeight: '65vh' }}
          />
        ) : (
          <div className="mt-6 rounded-3xl bg-wedding-surface border border-wedding-outline-variant p-6 flex-1 flex flex-col gap-4">
            {card.type === 'DID_YOU_KNOW' ? (
              <div className="flex items-center justify-center pt-4">
                <span
                  className="material-symbols-rounded text-wedding-tertiary"
                  style={{ fontSize: '56px', lineHeight: 1 }}
                >
                  lightbulb
                </span>
              </div>
            ) : (
              <div className="aspect-video bg-wedding-surface-container rounded-2xl flex items-center justify-center">
                <span
                  className="material-symbols-rounded text-wedding-outline"
                  style={{ fontSize: '48px', lineHeight: 1 }}
                >
                  {card.type === 'PHOTO' ? 'image' : 'movie'}
                </span>
              </div>
            )}

            <p className="font-serif text-lg sm:text-xl text-wedding-on-surface leading-relaxed text-center">
              {card.content}
            </p>
          </div>
        )}

        <Button onClick={() => router.push(`/${slug}/play`)} className="mt-6 mx-auto">
          {t('nextQuestion')}
          <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
            arrow_back
          </span>
        </Button>
      </div>

      <GameNav slug={slug} active="play" />
    </main>
  )
}
