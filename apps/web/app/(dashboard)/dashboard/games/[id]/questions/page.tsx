import { getQuestions } from '@/app/actions/questions'
import QuestionsList from './_components/QuestionsList'

type Props = { params: Promise<{ id: string }> }

export default async function QuestionsPage({ params }: Props) {
  const { id } = await params
  const questions = await getQuestions(id)
  return <QuestionsList gameId={id} initialQuestions={questions} />
}
