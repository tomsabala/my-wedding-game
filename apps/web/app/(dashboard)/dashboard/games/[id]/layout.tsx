import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import GameTabs from './_components/GameTabs'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function GameDetailLayout({ children, params }: Props) {
  const { id } = await params
  const t = await getTranslations('dashboard')
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-wedding-on-surface-variant hover:text-wedding-on-surface transition-colors"
        >
          <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
            arrow_back
          </span>
          {t('back')}
        </Link>
      </div>
      <GameTabs id={id} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
