const BASE_POINTS = 1000
const TIME_PENALTY_PER_SECOND = 50
const MIN_CORRECT_SCORE = 100

export function calculateQuestionScore(isCorrect: boolean, timeTakenMs: number): number {
  if (!isCorrect) return 0
  const penalty = Math.floor(timeTakenMs / 1000) * TIME_PENALTY_PER_SECOND
  return Math.max(MIN_CORRECT_SCORE, BASE_POINTS - penalty)
}

export function calculateTotalScore(
  answers: Array<{ isCorrect: boolean; timeTakenMs: number }>,
): number {
  return answers.reduce((sum, a) => sum + calculateQuestionScore(a.isCorrect, a.timeTakenMs), 0)
}
