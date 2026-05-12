'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/app/actions/questions'

type Question = {
  id: string
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  position: number
}

type Props = {
  gameId: string
  initialQuestions: Question[]
}

type FormState = {
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
}

const EMPTY_FORM: FormState = {
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
}

export default function QuestionsList({ gameId, initialQuestions }: Props) {
  const t = useTranslations('questions')
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAddSubmit(form: FormState) {
    setError(null)
    startTransition(async () => {
      const result = await createQuestion(gameId, form)
      if (!result.success) {
        setError(result.error)
        return
      }
      const created: Question = {
        id: result.data.id,
        text: form.text,
        options: form.options,
        correctIndex: form.correctIndex,
        position: questions.length,
      }
      setQuestions((prev) => [...prev, created])
      setAdding(false)
    })
  }

  function handleUpdateSubmit(id: string, form: FormState) {
    setError(null)
    startTransition(async () => {
      const result = await updateQuestion(id, form)
      if (!result.success) {
        setError(result.error)
        return
      }
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                text: form.text,
                options: form.options,
                correctIndex: form.correctIndex,
              }
            : q,
        ),
      )
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    setError(null)
    const prev = questions
    setQuestions(prev.filter((q) => q.id !== id))
    startTransition(async () => {
      const result = await deleteQuestion(id)
      if (!result.success) {
        setError(result.error)
        setQuestions(prev)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-wedding-on-surface">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-wedding-on-surface-variant">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setAdding(true)} disabled={adding}>
          <span className="material-symbols-rounded" style={{ fontSize: '18px', lineHeight: 1 }}>
            add
          </span>
          {t('add')}
        </Button>
      </div>

      {/* Tip box */}
      <div className="rounded-xl bg-wedding-secondary-container/50 border border-wedding-outline-variant p-4 flex gap-3">
        <span
          className="material-symbols-rounded text-wedding-secondary"
          style={{ fontSize: '20px', lineHeight: 1 }}
        >
          lightbulb
        </span>
        <p className="text-sm text-wedding-on-surface">{t('tip')}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Add form */}
      {adding && (
        <QuestionForm
          mode="create"
          initial={EMPTY_FORM}
          isPending={isPending}
          onCancel={() => setAdding(false)}
          onSubmit={handleAddSubmit}
        />
      )}

      {/* List */}
      {questions.length === 0 && !adding ? (
        <div className="rounded-2xl bg-wedding-surface border border-dashed border-wedding-outline-variant p-10 text-center">
          <p className="text-sm text-wedding-on-surface-variant">{t('empty')}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) =>
            editingId === q.id ? (
              <li key={q.id}>
                <QuestionForm
                  mode="edit"
                  initial={{
                    text: q.text,
                    options: q.options,
                    correctIndex: q.correctIndex,
                  }}
                  isPending={isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(form) => handleUpdateSubmit(q.id, form)}
                />
              </li>
            ) : (
              <li
                key={q.id}
                className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="inline-block rounded-full bg-wedding-primary-container px-2.5 py-0.5 text-xs font-semibold text-wedding-primary">
                      {t('position', { n: q.position + 1 })}
                    </span>
                    <h3 className="mt-2 font-serif text-lg font-semibold text-wedding-on-surface">
                      {q.text}
                    </h3>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setEditingId(q.id)}
                      aria-label={t('edit')}
                    >
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: '16px', lineHeight: 1 }}
                      >
                        edit
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleDelete(q.id)}
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
                </div>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${
                        i === q.correctIndex
                          ? 'border-wedding-tertiary bg-wedding-tertiary-container/30'
                          : 'border-wedding-outline-variant'
                      }`}
                    >
                      <span
                        className={`material-symbols-rounded ${
                          i === q.correctIndex
                            ? 'text-wedding-tertiary'
                            : 'text-wedding-outline'
                        }`}
                        style={{ fontSize: '18px', lineHeight: 1 }}
                      >
                        {i === q.correctIndex ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className="text-wedding-on-surface">{opt}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}

// ─── Inline form (create + edit) ────────────────────────────────────────────

function QuestionForm({
  mode,
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial: FormState
  isPending: boolean
  onSubmit: (form: FormState) => void
  onCancel: () => void
}) {
  const t = useTranslations('questions')
  const [text, setText] = useState(initial.text)
  const [options, setOptions] = useState<[string, string, string, string]>(initial.options)
  const [correctIndex, setCorrectIndex] = useState<0 | 1 | 2 | 3>(initial.correctIndex)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleOption(i: 0 | 1 | 2 | 3, value: string) {
    setOptions((prev) => {
      const next = [...prev] as [string, string, string, string]
      next[i] = value
      return next
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError(null)
    if (!text.trim()) {
      setLocalError(t('errors.textRequired'))
      return
    }
    if (options.some((o) => !o.trim())) {
      setLocalError(t('errors.optionsRequired'))
      return
    }
    onSubmit({ text: text.trim(), options, correctIndex })
  }

  const optionLabels = [t('optionA'), t('optionB'), t('optionC'), t('optionD')]

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-wedding-surface border border-wedding-outline-variant p-5 space-y-4"
    >
      <h2 className="font-serif text-lg font-semibold text-wedding-on-surface">
        {mode === 'create' ? t('addTitle') : t('editTitle')}
      </h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="question-text">{t('questionText')}</Label>
        <textarea
          id="question-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-md border border-wedding-outline-variant bg-wedding-surface p-3 text-sm text-wedding-on-surface focus:border-wedding-primary focus:outline-none focus:ring-2 focus:ring-wedding-primary/20"
          rows={2}
          maxLength={500}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-wedding-on-surface">
          {t('correctAnswer')}
        </legend>
        {optionLabels.map((label, idx) => {
          const i = idx as 0 | 1 | 2 | 3
          const isCorrect = correctIndex === i
          return (
            <label
              key={i}
              className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer ${
                isCorrect
                  ? 'border-wedding-tertiary bg-wedding-tertiary-container/20'
                  : 'border-wedding-outline-variant'
              }`}
            >
              <input
                type="radio"
                name="correctIndex"
                checked={isCorrect}
                onChange={() => setCorrectIndex(i)}
                className="accent-wedding-tertiary shrink-0"
              />
              <span className="text-sm font-semibold text-wedding-on-surface w-10 shrink-0">
                {label}
              </span>
              <Input
                value={options[i]}
                onChange={(e) => handleOption(i, e.target.value)}
                maxLength={200}
                className="flex-1"
              />
            </label>
          )
        })}
      </fieldset>

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
