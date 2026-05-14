'use client'

import { useState, useRef, useCallback, useEffect, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type {
  CardLayout,
  CardElement,
  CardTextElement,
  CardImageElement,
  CardBackground,
} from '@repo/shared'

import { Button } from '@/components/ui/button'
import CardLayoutRenderer from '@/components/CardLayoutRenderer'
import { getMediaItems } from '@/app/actions/media'
import { updatePassingCardLayout } from '@/app/actions/passingCards'
import type { MediaItem } from '@/app/actions/media'

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_COLORS = ['#fdf6f0', '#ffffff', '#1a1a2e', '#2d2d2d', '#7b5455', '#5c5d6e']
type Tab = 'background' | 'elements' | 'properties'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cardId: string
  gameId: string
  initialLayout: CardLayout | null
  onClose: () => void
  onSaved: (layout: CardLayout) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function defaultLayout(): CardLayout {
  return { background: { type: 'color', color: '#fdf6f0' }, elements: [] }
}

function defaultText(): CardTextElement {
  return {
    id: makeId(), type: 'text',
    x: 10, y: 40, width: 80,
    text: 'הקלידו טקסט כאן',
    fontSize: 28, color: '#1a1a1a', rotation: 0,
    align: 'center', bold: false, italic: false,
  }
}

function defaultImage(url: string): CardImageElement {
  return {
    id: makeId(), type: 'image',
    x: 10, y: 10, width: 80, height: 50,
    url, rotation: 0, opacity: 1, zoom: 1, panX: 0.5, panY: 0.5,
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CardEditor({ cardId, gameId, initialLayout, onClose, onSaved }: Props) {
  const t = useTranslations('cardEditor')
  const [layout, setLayout] = useState<CardLayout>(initialLayout ?? defaultLayout())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('background')
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedEl = layout.elements.find((e) => e.id === selectedId) ?? null

  useEffect(() => {
    setMediaLoading(true)
    getMediaItems(gameId)
      .then(({ items }) => setMediaItems(items.filter((i) => i.contentType?.startsWith('image/'))))
      .finally(() => setMediaLoading(false))
  }, [gameId])

  useEffect(() => {
    if (selectedId) setTab('properties')
  }, [selectedId])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateEl = useCallback((id: string, patch: Partial<CardElement>) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as CardElement) : e)),
    }))
  }, [])

  const deleteEl = useCallback((id: string) => {
    setLayout((prev) => ({ ...prev, elements: prev.elements.filter((e) => e.id !== id) }))
    setSelectedId((s) => (s === id ? null : s))
  }, [])

  const addText = () => {
    const el = defaultText()
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, el] }))
    setSelectedId(el.id)
  }

  const addImage = (url: string) => {
    const el = defaultImage(url)
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, el] }))
    setSelectedId(el.id)
  }

  const setBg = (patch: Partial<CardBackground>) => {
    setLayout((prev) => ({ ...prev, background: { ...prev.background, ...patch } }))
  }

  // ── Drag / Resize / Rotate on canvas ─────────────────────────────────────

  // Stores { startPx: {x,y}, startEl: {x,y}, kind: 'move'|'resize-se'|'rotate' }
  const interactRef = useRef<{
    kind: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw' | 'rotate'
    startPx: { x: number; y: number }
    startEl: Partial<CardElement> & { x: number; y: number }
    id: string
  } | null>(null)

  const canvasRect = useCallback(() => canvasRef.current?.getBoundingClientRect() ?? null, [])

  const startInteract = useCallback(
    (
      e: React.PointerEvent,
      id: string,
      kind: NonNullable<typeof interactRef['current']>['kind'],
    ) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const el = layout.elements.find((x) => x.id === id)
      if (!el) return
      interactRef.current = {
        kind,
        startPx: { x: e.clientX, y: e.clientY },
        startEl: { ...el },
        id,
      }
    },
    [layout.elements],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ctx = interactRef.current
      if (!ctx) return
      const rect = canvasRect()
      if (!rect) return
      const dx = ((e.clientX - ctx.startPx.x) / rect.width) * 100
      const dy = ((e.clientY - ctx.startPx.y) / rect.height) * 100
      const { id, kind, startEl } = ctx

      if (kind === 'move') {
        updateEl(id, {
          x: clamp((startEl.x ?? 0) + dx, 0, 95),
          y: clamp((startEl.y ?? 0) + dy, 0, 95),
        })
      } else if (kind === 'resize-se') {
        const w = (startEl as CardElement & { width: number }).width
        const h = (startEl as CardImageElement).height
        updateEl(id, {
          width: clamp(w + dx, 5, 100),
          ...(h !== undefined ? { height: clamp(h + dy, 5, 100) } : {}),
        })
      } else if (kind === 'resize-sw') {
        const w = (startEl as CardElement & { width: number }).width
        const h = (startEl as CardImageElement).height
        const newW = clamp(w - dx, 5, 100)
        updateEl(id, {
          x: clamp((startEl.x ?? 0) + dx, 0, 95),
          width: newW,
          ...(h !== undefined ? { height: clamp(h + dy, 5, 100) } : {}),
        })
      } else if (kind === 'resize-ne') {
        const w = (startEl as CardElement & { width: number }).width
        const h = (startEl as CardImageElement).height
        updateEl(id, {
          y: clamp((startEl.y ?? 0) + dy, 0, 95),
          width: clamp(w + dx, 5, 100),
          ...(h !== undefined ? { height: clamp(h - dy, 5, 100) } : {}),
        })
      } else if (kind === 'resize-nw') {
        const w = (startEl as CardElement & { width: number }).width
        const h = (startEl as CardImageElement).height
        const newW = clamp(w - dx, 5, 100)
        updateEl(id, {
          x: clamp((startEl.x ?? 0) + dx, 0, 95),
          y: clamp((startEl.y ?? 0) + dy, 0, 95),
          width: newW,
          ...(h !== undefined ? { height: clamp(h - dy, 5, 100) } : {}),
        })
      } else if (kind === 'rotate') {
        // Compute angle from element center to current pointer
        const el = layout.elements.find((x) => x.id === id)
        if (!el) return
        const elCenterX = rect.left + ((el.x + el.width / 2) / 100) * rect.width
        const elH = el.type === 'image' ? (el as CardImageElement).height : 20
        const elCenterY = rect.top + ((el.y + elH / 2) / 100) * rect.height
        const angle = Math.atan2(e.clientY - elCenterY, e.clientX - elCenterX) * (180 / Math.PI) + 90
        updateEl(id, { rotation: Math.round(angle) })
      }
    },
    [canvasRect, layout.elements, updateEl],
  )

  const onPointerUp = useCallback(() => {
    interactRef.current = null
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updatePassingCardLayout(cardId, layout)
      if (!result.success) {
        setError(result.error ?? 'שגיאה בשמירה')
        return
      }
      onSaved(layout)
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch">
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-wedding-bg" dir="rtl">
        {/* Mobile header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-wedding-outline-variant bg-wedding-surface lg:hidden">
          <h2 className="font-serif text-lg font-semibold text-wedding-on-surface">{t('title')}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t('done')}
            </Button>
          </div>
        </div>

        {/* Canvas column */}
        <div
          className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-0 overflow-auto"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            ref={canvasRef}
            className="relative bg-wedding-surface-container rounded-2xl shadow-lg overflow-hidden select-none"
            style={{
              width: 'min(350px, calc((100dvh - 180px) * 9 / 16), calc(100vw - 300px - 32px))',
              aspectRatio: '9/16',
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Rendered layout */}
            <CardLayoutRenderer layout={layout} className="absolute inset-0" />

            {/* Interactive element overlays */}
            {layout.elements.map((el) => (
              <ElementHandle
                key={el.id}
                el={el}
                selected={el.id === selectedId}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                onStartMove={(e) => startInteract(e, el.id, 'move')}
                onStartResizeSE={(e) => startInteract(e, el.id, 'resize-se')}
                onStartResizeSW={(e) => startInteract(e, el.id, 'resize-sw')}
                onStartResizeNE={(e) => startInteract(e, el.id, 'resize-ne')}
                onStartResizeNW={(e) => startInteract(e, el.id, 'resize-nw')}
                onStartRotate={(e) => startInteract(e, el.id, 'rotate')}
              />
            ))}
          </div>
        </div>

        {/* Toolbar column */}
        <div className="w-full lg:w-72 flex flex-col border-t lg:border-t-0 lg:border-s border-wedding-outline-variant bg-wedding-surface overflow-y-auto">
          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between gap-3 px-5 py-4 border-b border-wedding-outline-variant">
            <h2 className="font-serif text-base font-semibold text-wedding-on-surface">{t('title')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon-sm" onClick={onClose} disabled={isPending} aria-label={t('cancel')}>
                <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>close</span>
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {t('done')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-wedding-outline-variant px-2 pt-2 gap-1">
            {(['background', 'elements', 'properties'] as Tab[]).map((tab_) => (
              <button
                key={tab_}
                type="button"
                onClick={() => setTab(tab_)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                  tab === tab_
                    ? 'bg-wedding-surface text-wedding-primary border-t border-x border-wedding-outline-variant -mb-px'
                    : 'text-wedding-on-surface-variant hover:text-wedding-on-surface'
                }`}
              >
                {t(`tabs.${tab_}`)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {tab === 'background' && (
              <BackgroundPanel background={layout.background} mediaItems={mediaItems} mediaLoading={mediaLoading} onChange={setBg} t={t} />
            )}
            {tab === 'elements' && (
              <ElementsPanel elements={layout.elements} selectedId={selectedId} onSelect={setSelectedId} onAddText={addText} onAddImage={addImage} onDelete={deleteEl} mediaItems={mediaItems} mediaLoading={mediaLoading} t={t} />
            )}
            {tab === 'properties' && (
              <PropertiesPanel element={selectedEl} onUpdate={(p) => selectedId && updateEl(selectedId, p)} onDelete={() => selectedId && deleteEl(selectedId)} t={t} />
            )}
          </div>

          {error && <p className="px-4 pb-4 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── ElementHandle — transparent overlay with selection ring + handles ───────

function ElementHandle({
  el,
  selected,
  onClick,
  onStartMove,
  onStartResizeSE,
  onStartResizeSW,
  onStartResizeNE,
  onStartResizeNW,
  onStartRotate,
}: {
  el: CardElement
  selected: boolean
  onClick: (e: React.MouseEvent) => void
  onStartMove: (e: React.PointerEvent) => void
  onStartResizeSE: (e: React.PointerEvent) => void
  onStartResizeSW: (e: React.PointerEvent) => void
  onStartResizeNE: (e: React.PointerEvent) => void
  onStartResizeNW: (e: React.PointerEvent) => void
  onStartRotate: (e: React.PointerEvent) => void
}) {
  const h = el.type === 'image' ? (el as CardImageElement).height : 20

  return (
    <div
      style={{
        position: 'absolute',
        left: `${el.x}%`,
        top: `${el.y}%`,
        width: `${el.width}%`,
        height: `${h}%`,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        cursor: 'move',
        outline: selected ? '2px solid #7b5455' : 'none',
        boxSizing: 'border-box',
      }}
      onClick={onClick}
      onPointerDown={onStartMove}
    >
      {selected && (
        <>
          {/* Rotation handle */}
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#7b5455',
              cursor: 'grab',
              zIndex: 10,
            }}
            onPointerDown={(e) => { e.stopPropagation(); onStartRotate(e) }}
          />
          {/* Resize NW */}
          <ResizeHandle corner="nw" onPointerDown={(e) => { e.stopPropagation(); onStartResizeNW(e) }} />
          {/* Resize NE */}
          <ResizeHandle corner="ne" onPointerDown={(e) => { e.stopPropagation(); onStartResizeNE(e) }} />
          {/* Resize SE */}
          <ResizeHandle corner="se" onPointerDown={(e) => { e.stopPropagation(); onStartResizeSE(e) }} />
          {/* Resize SW */}
          <ResizeHandle corner="sw" onPointerDown={(e) => { e.stopPropagation(); onStartResizeSW(e) }} />
        </>
      )}
    </div>
  )
}

function ResizeHandle({
  corner,
  onPointerDown,
}: {
  corner: 'nw' | 'ne' | 'se' | 'sw'
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const pos: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    background: '#fff',
    border: '2px solid #7b5455',
    borderRadius: '2px',
    zIndex: 10,
    ...(corner === 'nw' ? { top: '-5px', left: '-5px', cursor: 'nw-resize' }
      : corner === 'ne' ? { top: '-5px', right: '-5px', cursor: 'ne-resize' }
      : corner === 'se' ? { bottom: '-5px', right: '-5px', cursor: 'se-resize' }
      : { bottom: '-5px', left: '-5px', cursor: 'sw-resize' }),
  }
  return <div style={pos} onPointerDown={onPointerDown} />
}

// ─── BackgroundPanel ──────────────────────────────────────────────────────────

function BackgroundPanel({
  background, mediaItems, mediaLoading, onChange, t,
}: {
  background: CardBackground
  mediaItems: MediaItem[]
  mediaLoading: boolean
  onChange: (patch: Partial<CardBackground>) => void
  t: ReturnType<typeof useTranslations<'cardEditor'>>
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-wedding-on-surface-variant mb-2">{t('bg.colorLabel')}</p>
        <div className="flex flex-wrap gap-2">
          {BG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ type: 'color', color: c })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ backgroundColor: c, borderColor: background.color === c && background.type === 'color' ? '#7b5455' : '#d4c2c2' }}
            />
          ))}
          <label className="w-8 h-8 rounded-full border-2 border-wedding-outline-variant overflow-hidden cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-gradient-to-br from-red-400 via-yellow-300 to-blue-400">
            <input type="color" className="opacity-0 w-0 h-0 absolute" value={background.color ?? '#ffffff'} onChange={(e) => onChange({ type: 'color', color: e.target.value })} />
          </label>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-wedding-on-surface-variant mb-2">{t('bg.imageLabel')}</p>
        {mediaLoading ? (
          <p className="flex items-center gap-2 text-xs text-wedding-on-surface-variant"><Loader2 className="size-4 animate-spin" />{t('loading')}</p>
        ) : mediaItems.length === 0 ? (
          <p className="text-xs text-wedding-on-surface-variant">{t('bg.noImages')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {mediaItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => onChange({ type: 'image', imageUrl: item.url, imageZoom: 1, imageX: 0.5, imageY: 0.5 })}
                className="aspect-square rounded-lg overflow-hidden border-2 hover:border-wedding-primary transition-colors"
                style={{ borderColor: background.imageUrl === item.url ? '#7b5455' : 'transparent' }}
              >
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {background.type === 'image' && background.imageUrl && (
          <div className="mt-3 space-y-3">
            <SliderField label={t('bg.zoom')} min={1} max={3} step={0.05} value={background.imageZoom ?? 1} onChange={(v) => onChange({ imageZoom: v })} />
            <SliderField label={t('bg.panX')} min={0} max={1} step={0.01} value={background.imageX ?? 0.5} onChange={(v) => onChange({ imageX: v })} />
            <SliderField label={t('bg.panY')} min={0} max={1} step={0.01} value={background.imageY ?? 0.5} onChange={(v) => onChange({ imageY: v })} />
            <button type="button" className="text-xs text-wedding-on-surface-variant hover:text-destructive" onClick={() => onChange({ type: 'color', imageUrl: undefined })}>
              {t('bg.removeImage')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ElementsPanel ────────────────────────────────────────────────────────────

function ElementsPanel({
  elements, selectedId, onSelect, onAddText, onAddImage, onDelete, mediaItems, mediaLoading, t,
}: {
  elements: CardElement[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddText: () => void
  onAddImage: (url: string) => void
  onDelete: (id: string) => void
  mediaItems: MediaItem[]
  mediaLoading: boolean
  t: ReturnType<typeof useTranslations<'cardEditor'>>
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 text-xs" onClick={onAddText}>
          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>text_fields</span>
          {t('elements.addText')}
        </Button>
        <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowPicker((v) => !v)}>
          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>add_photo_alternate</span>
          {t('elements.addImage')}
        </Button>
      </div>

      {showPicker && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-wedding-on-surface-variant">{t('elements.pickImage')}</p>
          {mediaLoading ? (
            <p className="flex items-center gap-2 text-xs text-wedding-on-surface-variant"><Loader2 className="size-4 animate-spin" />{t('loading')}</p>
          ) : mediaItems.length === 0 ? (
            <p className="text-xs text-wedding-on-surface-variant">{t('bg.noImages')}</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {mediaItems.map((item) => (
                <button key={item.path} type="button" onClick={() => { onAddImage(item.url); setShowPicker(false) }}
                  className="aspect-square rounded-lg overflow-hidden border border-wedding-outline-variant hover:border-wedding-primary transition-colors">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {elements.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-wedding-on-surface-variant">{t('elements.list')}</p>
          {elements.map((el) => (
            <div key={el.id}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer border transition-colors ${selectedId === el.id ? 'bg-wedding-primary/10 border-wedding-primary' : 'border-wedding-outline-variant hover:bg-wedding-surface-container'}`}
              onClick={() => onSelect(el.id)}
            >
              <span className="material-symbols-rounded text-wedding-on-surface-variant" style={{ fontSize: '16px' }}>
                {el.type === 'text' ? 'text_fields' : 'image'}
              </span>
              <span className="flex-1 text-xs text-wedding-on-surface truncate">
                {el.type === 'text' ? (el as CardTextElement).text.slice(0, 30) : t('elements.imageEl')}
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(el.id) }} className="text-wedding-outline hover:text-destructive" aria-label={t('elements.delete')}>
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── PropertiesPanel ──────────────────────────────────────────────────────────

function PropertiesPanel({
  element, onUpdate, onDelete, t,
}: {
  element: CardElement | null
  onUpdate: (patch: Partial<CardElement>) => void
  onDelete: () => void
  t: ReturnType<typeof useTranslations<'cardEditor'>>
}) {
  if (!element) {
    return <p className="text-xs text-wedding-on-surface-variant">{t('properties.noSelection')}</p>
  }

  if (element.type === 'text') {
    const el = element as CardTextElement
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-wedding-on-surface-variant">{t('properties.text')}</label>
          <textarea value={el.text} onChange={(e) => onUpdate({ text: e.target.value })} rows={3} dir="rtl"
            className="rounded-md border border-wedding-outline-variant bg-wedding-surface p-2 text-sm text-wedding-on-surface focus:border-wedding-primary focus:outline-none resize-none" />
        </div>
        <SliderField label={t('properties.fontSize')} min={12} max={80} step={1} value={el.fontSize} onChange={(v) => onUpdate({ fontSize: v })} display={`${el.fontSize}px`} />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-wedding-on-surface-variant">{t('properties.color')}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={el.color} onChange={(e) => onUpdate({ color: e.target.value })} className="w-8 h-8 rounded border border-wedding-outline-variant cursor-pointer" />
            <span className="text-xs text-wedding-on-surface-variant">{el.color}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-wedding-on-surface-variant">{t('properties.align')}</label>
          <div className="flex gap-1">
            {(['right', 'center', 'left'] as const).map((a) => (
              <button key={a} type="button" onClick={() => onUpdate({ align: a })}
                className={`flex-1 py-1 rounded text-xs transition-colors ${el.align === a ? 'bg-wedding-primary text-wedding-on-primary' : 'bg-wedding-surface-container text-wedding-on-surface-variant'}`}>
                <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>
                  {a === 'right' ? 'format_align_right' : a === 'center' ? 'format_align_center' : 'format_align_left'}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onUpdate({ bold: !el.bold })}
            className={`flex-1 py-1.5 rounded text-sm font-bold transition-colors ${el.bold ? 'bg-wedding-primary text-wedding-on-primary' : 'bg-wedding-surface-container text-wedding-on-surface-variant'}`}>B</button>
          <button type="button" onClick={() => onUpdate({ italic: !el.italic })}
            className={`flex-1 py-1.5 rounded text-sm italic transition-colors ${el.italic ? 'bg-wedding-primary text-wedding-on-primary' : 'bg-wedding-surface-container text-wedding-on-surface-variant'}`}>I</button>
        </div>
        <SliderField label={t('properties.rotation')} min={-180} max={180} step={1} value={el.rotation} onChange={(v) => onUpdate({ rotation: v })} display={`${el.rotation}°`} />
        <button type="button" onClick={onDelete} className="w-full py-1.5 rounded text-xs text-destructive border border-destructive hover:bg-destructive/10 transition-colors">
          {t('properties.delete')}
        </button>
      </div>
    )
  }

  const el = element as CardImageElement
  return (
    <div className="space-y-4">
      <SliderField label={t('properties.opacity')} min={0.1} max={1} step={0.05} value={el.opacity} onChange={(v) => onUpdate({ opacity: v })} display={`${Math.round(el.opacity * 100)}%`} />
      <SliderField label={t('properties.imageZoom')} min={1} max={4} step={0.05} value={el.zoom ?? 1} onChange={(v) => onUpdate({ zoom: v })} />
      <SliderField label={t('properties.panX')} min={0} max={1} step={0.01} value={el.panX ?? 0.5} onChange={(v) => onUpdate({ panX: v })} />
      <SliderField label={t('properties.panY')} min={0} max={1} step={0.01} value={el.panY ?? 0.5} onChange={(v) => onUpdate({ panY: v })} />
      <SliderField label={t('properties.rotation')} min={-180} max={180} step={1} value={el.rotation} onChange={(v) => onUpdate({ rotation: v })} display={`${el.rotation}°`} />
      <button type="button" onClick={onDelete} className="w-full py-1.5 rounded text-xs text-destructive border border-destructive hover:bg-destructive/10 transition-colors">
        {t('properties.delete')}
      </button>
    </div>
  )
}

// ─── SliderField ──────────────────────────────────────────────────────────────

function SliderField({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; display?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-xs font-semibold text-wedding-on-surface-variant">{label}</label>
        <span className="text-xs text-wedding-on-surface-variant">{display ?? value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-wedding-primary" />
    </div>
  )
}
