import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import CreateGameForm from './_components/CreateGameForm'

export default async function NewGamePage() {
  const t = await getTranslations('dashboard')
  const tForm = await getTranslations('dashboard.createForm')

  return (
    <div
      className="mx-auto max-w-lg rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        backdropFilter: 'blur(8px)',
        padding: '32px',
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="tracking-tight text-white"
          style={{
            fontSize: 'var(--dashboard-heading-size)',
            fontWeight: 'var(--dashboard-heading-weight)',
          }}
        >
          {tForm('title')}
        </h1>
        <Link href="/dashboard">
          <Button style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontWeight: 600 }}>
            {t('back')}
          </Button>
        </Link>
      </div>
      <CreateGameForm />
    </div>
  )
}
