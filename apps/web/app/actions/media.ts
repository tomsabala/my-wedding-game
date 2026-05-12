'use server'

import { revalidatePath } from 'next/cache'

import { assertGameOwner, type ActionResult } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'game-media'
const MAX_BYTES = 25 * 1024 * 1024 // 25 MB per file
const STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB display target

export type MediaItem = {
  path: string
  name: string
  url: string
  sizeBytes: number
  contentType: string | null
  createdAt: string
}

export async function getMediaItems(
  gameId: string,
): Promise<{ items: MediaItem[]; totalBytes: number; quotaBytes: number }> {
  const { user } = await assertGameOwner(gameId)
  const supabase = await createClient()
  const prefix = `${user.id}/${gameId}`

  const { data: files, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    return { items: [], totalBytes: 0, quotaBytes: STORAGE_QUOTA_BYTES }
  }

  const items: MediaItem[] = (files ?? [])
    .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const path = `${prefix}/${f.name}`
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const sizeBytes = (f.metadata?.['size'] as number | undefined) ?? 0
      const contentType = (f.metadata?.['mimetype'] as string | undefined) ?? null
      return {
        path,
        name: f.name,
        url: pub.publicUrl,
        sizeBytes,
        contentType,
        createdAt: f.created_at ?? new Date().toISOString(),
      }
    })

  const totalBytes = items.reduce((sum, i) => sum + i.sizeBytes, 0)
  return { items, totalBytes, quotaBytes: STORAGE_QUOTA_BYTES }
}

export async function uploadMediaItem(
  gameId: string,
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  const { user } = await assertGameOwner(gameId)
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'לא נבחר קובץ' }
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: 'הקובץ גדול מדי (מקסימום 25MB)' }
  }
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { success: false, error: 'סוג קובץ לא נתמך — רק תמונות וסרטונים' }
  }

  const supabase = await createClient()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${gameId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    return { success: false, error: `שגיאת העלאה: ${error.message}` }
  }

  revalidatePath(`/dashboard/games/${gameId}/media`)
  return { success: true, data: { path } }
}

export async function deleteMediaItem(
  gameId: string,
  path: string,
): Promise<ActionResult> {
  const { user } = await assertGameOwner(gameId)

  // Path safety: must live under {userId}/{gameId}/
  const required = `${user.id}/${gameId}/`
  if (!path.startsWith(required)) {
    return { success: false, error: 'נתיב קובץ לא חוקי' }
  }

  const supabase = await createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    return { success: false, error: `שגיאת מחיקה: ${error.message}` }
  }

  revalidatePath(`/dashboard/games/${gameId}/media`)
  return { success: true }
}
