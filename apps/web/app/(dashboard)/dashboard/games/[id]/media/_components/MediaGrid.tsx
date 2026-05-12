'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { uploadMediaItem, deleteMediaItem, type MediaItem } from '@/app/actions/media'

type Props = {
  gameId: string
  initialItems: MediaItem[]
  totalBytes: number
  quotaBytes: number
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function MediaGrid({ gameId, initialItems, totalBytes, quotaBytes }: Props) {
  const t = useTranslations('media')
  const [items, setItems] = useState<MediaItem[]>(initialItems)
  const [used, setUsed] = useState(totalBytes)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInput = useRef<HTMLInputElement>(null)

  const pct = Math.min(100, Math.round((used / quotaBytes) * 100))

  function onUploadClick() {
    fileInput.current?.click()
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    startTransition(async () => {
      const result = await uploadMediaItem(gameId, fd)
      if (!result.success) {
        setError(result.error)
      } else {
        // Reload so the newly-uploaded file appears with its server-resolved public URL.
        window.location.reload()
      }
      if (fileInput.current) fileInput.current.value = ''
    })
  }

  function handleDelete(path: string) {
    if (!confirm(t('deleteConfirm'))) return
    setError(null)
    const prev = items
    const removed = prev.find((i) => i.path === path)
    setItems(prev.filter((i) => i.path !== path))
    if (removed) setUsed((u) => Math.max(0, u - removed.sizeBytes))
    startTransition(async () => {
      const result = await deleteMediaItem(gameId, path)
      if (!result.success) {
        setError(result.error)
        setItems(prev)
        if (removed) setUsed((u) => u + removed.sizeBytes)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-wedding-on-surface">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-wedding-on-surface-variant">{t('subtitle')}</p>
        </div>
        <Button onClick={onUploadClick} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
              upload
            </span>
          )}
          {t('upload')}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          onChange={onFileSelected}
          className="hidden"
        />
      </div>

      {/* Storage indicator */}
      <div className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-wedding-on-surface-variant">
          <span>{t('storage')}</span>
          <span>
            {formatBytes(used)} / {formatBytes(quotaBytes)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-wedding-surface-container overflow-hidden">
          <div
            className="h-full rounded-full bg-wedding-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-wedding-surface border border-dashed border-wedding-outline-variant p-10 text-center">
          <span
            className="material-symbols-rounded text-wedding-outline"
            style={{ fontSize: '40px', lineHeight: 1 }}
          >
            photo_library
          </span>
          <p className="mt-2 text-sm text-wedding-on-surface-variant">{t('empty')}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isVideo = (item.contentType ?? '').startsWith('video/')
            return (
              <li
                key={item.path}
                className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant overflow-hidden flex flex-col"
              >
                <div className="relative aspect-video bg-wedding-surface-container">
                  {isVideo ? (
                    <>
                      <video src={item.url} className="size-full object-cover" preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span
                          className="material-symbols-rounded text-white drop-shadow-lg"
                          style={{ fontSize: '48px', lineHeight: 1 }}
                        >
                          play_circle
                        </span>
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.name}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-wedding-on-surface">{item.name}</p>
                    <p className="text-xs text-wedding-on-surface-variant">
                      {formatBytes(item.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => handleDelete(item.path)}
                    aria-label={t('delete')}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ fontSize: '16px', lineHeight: 1 }}
                    >
                      delete
                    </span>
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
