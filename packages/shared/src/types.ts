export type GameStatus = 'DRAFT' | 'LIVE'

export type PassingCardType = 'DID_YOU_KNOW' | 'PHOTO' | 'VIDEO'

export interface Game {
  id: string
  userId: string
  slug: string
  coupleNames: string
  weddingDate: string
  tagline: string | null
  status: GameStatus
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  gameId: string
  text: string
  options: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  position: number
}

export interface PassingCard {
  id: string
  gameId: string
  type: PassingCardType
  content: string
  afterQuestionPosition: number | null
}

export interface Player {
  id: string
  gameId: string
  displayName: string
  score: number
  finishedAt: string | null
}

export interface PlayerAnswer {
  id: string
  playerId: string
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  timeTakenMs: number
}
