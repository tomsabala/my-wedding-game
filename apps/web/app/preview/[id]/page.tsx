import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@repo/db'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: Props) {
  const { id } = await params
  const t = await getTranslations('dashboard.preview')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const game = await prisma.game.findUnique({ where: { id } })
  if (!game || game.userId !== user.id) notFound()

  return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        {t('title')} — {game.coupleNames}
      </h1>
      <p className="text-muted-foreground">{t('comingSoon')}</p>
      <Link href={`/dashboard/games/${id}`}>
        <Button variant="outline">{t('back')}</Button>
      </Link>
    </div>
  )
}
