'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { PassingCardType, CardLayout } from '@repo/shared'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import CardLayoutRenderer from '@/components/CardLayoutRenderer'
import CardEditor from './CardEditor'
import {
  createPassingCard,
  updatePassingCard,
  deletePassingCard,
  savePassingCardsSequence,
} from '@/app/actions/passingCards'
import { PerfMount } from '@/components/perf-mount'

const CARD_TYPE_ICONS: Record<PassingCardType, string> = {
  DID_YOU_KNOW: 'lightbulb',
  PHOTO: 'image',
  VIDEO: 'movie',
}

type Card = {
  id: string
  type: PassingCardType
  content: string
  layout?: CardLayout | null
  afterQuestionPosition: number | null
}

type Props = {
  gameId: string
  initialCards: Card[]
  questionCount: number
}

type FormState = {
  type: PassingCardType
  content: string
  afterQuestionPosition: number | null
}

export default function PassingCardsList({ gameId, initialCards, questionCount }: Props) {
  const t = useTranslations('passingCards')
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [designingId, setDesigningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderSaved, setOrderSaved] = useState(false)
  const [orderDirty, setOrderDirty] = useState(false)
  const [isPending, startTransition] = useTransition()

  const designingCard = designingId ? cards.find((c) => c.id === designingId) ?? null : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setCards((prev) => {
      const oldIdx = prev.findIndex((c) => c.id === active.id)
      const newIdx = prev.findIndex((c) => c.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
    setOrderDirty(true)
  }

  function saveOrder() {
    setError(null)
    startTransition(async () => {
      const sequence = cards.map((c, i) => ({
        id: c.id,
        // Pack cards as "after question i" using their list position
        afterQuestionPosition: i < questionCount ? i : null,
      }))
      const result = await savePassingCardsSequence(gameId, sequence)
      if (!result.success) {
        setError(result.error)
        return
      }
      setOrderDirty(false)
      setOrderSaved(true)
      setTimeout(() => setOrderSaved(false), 2500)
    })
  }

  function handleAddSubmit(form: FormState) {
    setError(null)
    startTransition(async () => {
      const result = await createPassingCard(gameId, form)
      if (!result.success) {
        setError(result.error)
        return
      }
      const newId = result.data.id
      setCards((prev) => [
        ...prev,
        {
          id: newId,
          type: form.type,
          content: form.content,
          layout: null,
          afterQuestionPosition: form.afterQuestionPosition,
        },
      ])
      setAdding(false)
      setDesigningId(newId)
    })
  }

  function handleUpdateSubmit(id: string, form: FormState) {
    setError(null)
    startTransition(async () => {
      const result = await updatePassingCard(id, form)
      if (!result.success) {
        setError(result.error)
        return
      }
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                type: form.type,
                content: form.content,
                afterQuestionPosition: form.afterQuestionPosition,
              }
            : c,
        ),
      )
      setEditingId(null)
      setDesigningId(id)
    })
  }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setError(null)
    const prev = cards
    setCards(prev.filter((c) => c.id !== id))
    startTransition(async () => {
      const result = await deletePassingCard(id)
      if (!result.success) {
        setError(result.error)
        setCards(prev)
      }
    })
  }

  function handleLayoutSaved(cardId: string, layout: CardLayout) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, layout } : c)))
    setDesigningId(null)
  }

  return (
    <>
    <PerfMount label="dashboard/cards" />
    {designingCard && (
      <CardEditor
        cardId={designingCard.id}
        gameId={gameId}
        initialLayout={designingCard.layout ?? null}
        onClose={() => setDesigningId(null)}
        onSaved={(layout) => handleLayoutSaved(designingCard.id, layout)}
      />
    )}
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-wedding-on-surface">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-wedding-on-surface-variant">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {orderDirty && (
            <Button variant="outline" onClick={saveOrder} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {t('saveOrder')}
            </Button>
          )}
          {orderSaved && (
            <span className="text-xs text-wedding-on-surface-variant self-center">
              {t('orderSaved')}
            </span>
          )}
          <Button onClick={() => setAdding(true)} disabled={adding}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
              add
            </span>
            {t('add')}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {adding && (
        <CardForm
          mode="create"
          initial={{ type: 'DID_YOU_KNOW', content: '', afterQuestionPosition: null }}
          questionCount={questionCount}
          isPending={isPending}
          onCancel={() => setAdding(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {cards.length === 0 && !adding ? (
        <div className="rounded-2xl bg-wedding-surface border border-dashed border-wedding-outline-variant p-10 text-center">
          <p className="text-sm text-wedding-on-surface-variant">{t('empty')}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {cards.map((card) =>
                editingId === card.id ? (
                  <li key={card.id}>
                    <CardForm
                      mode="edit"
                      initial={{
                        type: card.type,
                        content: card.content,
                        afterQuestionPosition: card.afterQuestionPosition,
                      }}
                      questionCount={questionCount}
                      isPending={isPending}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(form) => handleUpdateSubmit(card.id, form)}
                    />
                  </li>
                ) : (
                  <SortableCard
                    key={card.id}
                    card={card}
                    onEdit={() => setEditingId(card.id)}
                    onDelete={() => handleDelete(card.id)}
                    onDesign={() => setDesigningId(card.id)}
                  />
                ),
              )}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
    </>
  )
}

// ─── Sortable card row ──────────────────────────────────────────────────────

function SortableCard({
  card,
  onEdit,
  onDelete,
  onDesign,
}: {
  card: Card
  onEdit: () => void
  onDelete: () => void
  onDesign: () => void
}) {
  const t = useTranslations('passingCards')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeLabel: Record<PassingCardType, string> = {
    DID_YOU_KNOW: t('typeDidYouKnow'),
    PHOTO: t('typePhoto'),
    VIDEO: t('typeVideo'),
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-4 flex items-start gap-3"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none mt-1 text-wedding-outline hover:text-wedding-on-surface"
        aria-label={t('drag')}
      >
        <span className="material-symbols-rounded" style={{ fontSize: '20px', lineHeight: 1 }}>
          drag_indicator
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full bg-wedding-secondary-container px-2.5 py-0.5 text-xs font-semibold text-wedding-secondary">
            <span
              className="material-symbols-rounded"
              style={{ fontSize: '14px', lineHeight: 1 }}
            >
              {CARD_TYPE_ICONS[card.type]}
            </span>
            {typeLabel[card.type]}
          </span>
          {card.afterQuestionPosition !== null ? (
            <span className="text-xs text-wedding-on-surface-variant">
              {t('afterQuestion', { n: card.afterQuestionPosition + 1 })}
            </span>
          ) : (
            <span className="text-xs text-wedding-on-surface-variant">{t('atEnd')}</span>
          )}
        </div>
        {card.layout ? (
          <div
            className="mt-2 w-16 rounded-lg overflow-hidden border border-wedding-outline-variant cursor-pointer hover:opacity-80 transition-opacity"
            style={{ aspectRatio: '9/16' }}
            onClick={onDesign}
            title={t('design')}
          >
            <CardLayoutRenderer layout={card.layout} className="relative overflow-hidden w-full h-full" />
          </div>
        ) : (
          <p className="mt-2 text-sm text-wedding-on-surface line-clamp-3">{card.content}</p>
        )}
      </div>

      <div className="flex gap-1 shrink-0">
        <Button variant="outline" size="icon-sm" onClick={onDesign} aria-label={t('design')}>
          <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
            auto_awesome
          </span>
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onEdit} aria-label={t('edit')}>
          <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
            edit
          </span>
        </Button>
        <Button variant="destructive" size="icon-sm" onClick={onDelete} aria-label={t('delete')}>
          <span className="material-symbols-rounded" style={{ fontSize: '16px', lineHeight: 1 }}>
            delete
          </span>
        </Button>
      </div>
    </li>
  )
}

// ─── Form (create + edit) ───────────────────────────────────────────────────

function CardForm({
  mode,
  initial,
  questionCount,
  isPending,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: FormState
  questionCount: number
  isPending: boolean
  onSubmit: (form: FormState) => void
  onCancel: () => void
}) {
  const t = useTranslations('passingCards')
  const [type, setType] = useState<PassingCardType>(initial.type)
  const [content, setContent] = useState(initial.content)
  const [position, setPosition] = useState<number | 'end'>(
    initial.afterQuestionPosition ?? 'end',
  )
  const [localError, setLocalError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!content.trim()) {
      setLocalError(t('errors.contentRequired'))
      return
    }
    onSubmit({
      type,
      content: content.trim(),
      afterQuestionPosition: position === 'end' ? null : position,
    })
  }

  const types: { value: PassingCardType; label: string; icon: string }[] = [
    { value: 'DID_YOU_KNOW', label: t('typeDidYouKnow'), icon: CARD_TYPE_ICONS.DID_YOU_KNOW },
    { value: 'PHOTO', label: t('typePhoto'), icon: CARD_TYPE_ICONS.PHOTO },
    { value: 'VIDEO', label: t('typeVideo'), icon: CARD_TYPE_ICONS.VIDEO },
  ]

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5 space-y-4"
    >
      <h2 className="font-serif text-lg font-semibold text-wedding-on-surface">
        {mode === 'create' ? t('addTitle') : t('editTitle')}
      </h2>

      <div className="space-y-2">
        <Label>{t('type')}</Label>
        <div className="flex gap-2 flex-wrap">
          {types.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                type === opt.value
                  ? 'bg-wedding-primary text-wedding-on-primary'
                  : 'bg-wedding-surface-container text-wedding-on-surface-variant hover:bg-wedding-surface-low'
              }`}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: '16px', lineHeight: 1 }}
              >
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-content">{t('content')}</Label>
        <textarea
          id="card-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="rounded-md border border-wedding-outline-variant bg-wedding-surface p-3 text-sm text-wedding-on-surface focus:border-wedding-primary focus:outline-none focus:ring-2 focus:ring-wedding-primary/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-position">{t('afterQuestionLabel')}</Label>
        <select
          id="card-position"
          value={position === 'end' ? 'end' : String(position)}
          onChange={(e) => {
            const v = e.target.value
            setPosition(v === 'end' ? 'end' : Number(v))
          }}
          className="rounded-md border border-wedding-outline-variant bg-wedding-surface p-2.5 text-sm text-wedding-on-surface focus:border-wedding-primary focus:outline-none focus:ring-2 focus:ring-wedding-primary/20"
        >
          {Array.from({ length: questionCount }).map((_, i) => (
            <option key={i} value={i}>
              {t('afterQuestion', { n: i + 1 })}
            </option>
          ))}
          <option value="end">{t('atEnd')}</option>
        </select>
      </div>

      {(type === 'PHOTO' || type === 'VIDEO') && (
        <p className="text-xs text-wedding-on-surface-variant">{t('mediaHint')}</p>
      )}

      {localError && <p className="text-xs text-destructive">{localError}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t('save')}
        </Button>
      </div>
    </form>
  )
}
