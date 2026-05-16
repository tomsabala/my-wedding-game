export type GameStatus = 'DRAFT' | 'LIVE'

// ─── Card layout types ───────────────────────────────────────────────────────

export interface CardBackground {
  type: 'color' | 'image'
  color?: string
  imageUrl?: string
  imageZoom?: number
  imageX?: number
  imageY?: number
}

export interface CardTextElement {
  id: string
  type: 'text'
  x: number
  y: number
  width: number
  text: string
  fontSize: number
  color: string
  rotation: number
  align: 'left' | 'center' | 'right'
  bold?: boolean
  italic?: boolean
  fontFamily?: string
  lineHeight?: number
  letterSpacing?: number
  opacity?: number
}

export interface CardImageElement {
  id: string
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  url: string
  rotation: number
  opacity: number
  zoom?: number
  panX?: number
  panY?: number
  borderRadius?: number
}

export type CardElement = CardTextElement | CardImageElement

export interface CardLayout {
  background: CardBackground
  elements: CardElement[]
}

export type PassingCardType = 'DID_YOU_KNOW' | 'PHOTO' | 'VIDEO'

export interface Game {
  id: string
  userId: string
  slug: string
  coupleNames: string
  weddingDate: string
  tagline: string | null
  welcomeMessage: string | null
  status: GameStatus
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  gameId: string
  text: string
  options: string[]
  correctIndex: number
  position: number
}

export interface PassingCard {
  id: string
  gameId: string
  type: PassingCardType
  content: string
  layout?: CardLayout | null
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
