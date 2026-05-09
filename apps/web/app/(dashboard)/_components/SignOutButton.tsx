'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type Props = { style?: React.CSSProperties }

export default function SignOutButton({ style }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button variant="outline" size="sm" onClick={signOut} style={style}>
      יציאה
    </Button>
  )
}
