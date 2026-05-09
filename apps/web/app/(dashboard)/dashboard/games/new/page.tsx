import { getTranslations } from 'next-intl/server'
import CreateGameForm from './_components/CreateGameForm'

export default async function NewGamePage() {
  const t = await getTranslations('dashboard.createForm')

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white shadow-xl" style={{ padding: '32px' }}>
      <h1
        className="mb-6 tracking-tight text-zinc-900"
        style={{
          fontSize: 'var(--dashboard-heading-size)',
          fontWeight: 'var(--dashboard-heading-weight)',
        }}
      >
        {t('title')}
      </h1>
      <CreateGameForm />
    </div>
  )
}
