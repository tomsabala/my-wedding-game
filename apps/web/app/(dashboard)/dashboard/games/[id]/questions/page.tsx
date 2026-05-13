import { getQuestions } from '@/app/actions/questions'
import { PerfMount } from '@/components/perf-mount'
import QuestionsList from './_components/QuestionsList'

type Props = { params: Promise<{ id: string }> }

export default async function QuestionsPage({ params }: Props) {
  const t0 = performance.now()
  const { id } = await params
  const questions = await getQuestions(id)
  console.log(`[perf-server] QuestionsPage total (assertGameOwner + DB): ${(performance.now() - t0).toFixed(1)}ms  questions=${questions.length}`)
  return (
    <>
      <PerfMount label="QuestionsPage" />
      <QuestionsList gameId={id} initialQuestions={questions} />
    </>
  )
}
