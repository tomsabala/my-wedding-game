import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditGamePage({ params }: Props) {
  const { id } = await params
  const t = await getTranslations('dashboard')

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white shadow-xl space-y-4" style={{ padding: '32px' }}>
      <h1
        className="tracking-tight text-zinc-900"
        style={{
          fontSize: 'var(--dashboard-heading-size)',
          fontWeight: 'var(--dashboard-heading-weight)',
        }}
      >
        {t('editGame')}
      </h1>
      <p className="text-zinc-400" style={{ fontSize: 'var(--dashboard-body-size)' }}>
        עורך המשחק יגיע בקרוב.
      </p>
      <Link href={`/dashboard/games/${id}`}>
        <Button variant="outline">{t('back')}</Button>
      </Link>
    </div>
  )
}
