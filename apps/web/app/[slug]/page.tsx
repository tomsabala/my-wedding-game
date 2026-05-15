import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPublicGame } from '@/app/actions/players'
import JoinGameForm from './_components/JoinGameForm'

type Props = { params: Promise<{ slug: string }> }

export default async function PlayerWelcomePage({ params }: Props) {
  const { slug } = await params
  const t = await getTranslations('player')

  const game = await getPublicGame(slug)

  if (!game) notFound()

  if (!game.isLive) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-wedding-bg px-6"
      >
        <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-8 text-center max-w-md">
          <span
            className="material-symbols-rounded text-wedding-outline"
            style={{ fontSize: '48px', lineHeight: 1 }}
          >
            event_busy
          </span>
          <h1 className="mt-3 font-serif text-2xl font-semibold text-wedding-on-surface">
            {t('gameNotLive')}
          </h1>
          <p className="mt-2 text-sm text-wedding-on-surface-variant">{t('checkBackLater')}</p>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="h-screen overflow-hidden bg-wedding-bg flex flex-col">
      <header className="px-6 py-4 flex items-center">
        <span className="font-serif text-lg font-semibold text-wedding-primary">
          Our Wedding Game
        </span>
      </header>

      <div className="flex-1 px-6 pb-6 flex flex-col items-center">
        <div className="w-full max-w-xl flex flex-col flex-1">
          {/* Join card */}
          <div className="flex-1 rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-6 shadow-sm flex flex-col">
            <h2 className="text-base font-semibold text-wedding-on-surface">
              {t('welcomeHeading', { coupleNames: game.coupleNames })}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-wedding-primary-container px-2.5 py-0.5 text-xs font-semibold text-wedding-primary">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: '14px', lineHeight: 1 }}
                >
                  quiz
                </span>
                {t('nQuestions', { n: game.questionCount })}
              </span>
            </div>

            <div className="mt-5 flex flex-col flex-1">
              <JoinGameForm slug={slug} />
            </div>
          </div>

          {/* Fun fact */}
          {game.funFact && (
            <div className="mt-6 rounded-2xl bg-wedding-secondary-container/40 border border-wedding-outline-variant p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-wedding-secondary">
                {t('didYouKnow')}
              </p>
              <p className="mt-2 font-serif text-base text-wedding-on-surface">{game.funFact}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
