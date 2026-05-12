'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const t = useTranslations('dashboard')
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut} className="text-wedding-on-surface-variant">
      {t('signOut')}
    </Button>
  )
}
