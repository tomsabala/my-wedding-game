import { z } from 'zod'

export const slugSchema = z.string().regex(/^[a-z]{3}$/, 'Slug must be exactly 3 lowercase letters')

export const createGameSchema = z.object({
  coupleNames: z.string().min(1).max(100),
  weddingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  tagline: z.string().max(200).nullable().optional(),
})

export const questionSchema = z.object({
  text: z.string().min(1).max(500),
  options: z.tuple([
    z.string().min(1).max(200),
    z.string().min(1).max(200),
    z.string().min(1).max(200),
    z.string().min(1).max(200),
  ]),
  correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  position: z.number().int().min(0),
})

export const passingCardSchema = z.object({
  type: z.enum(['DID_YOU_KNOW', 'PHOTO', 'VIDEO']),
  content: z.string().min(1),
  afterQuestionPosition: z.number().int().min(0).nullable().optional(),
})

export const joinGameSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().max(50).trim().optional(),
})

export const submitScoreSchema = z.object({
  playerId: z.string().uuid(),
  score: z.number().int().min(0),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedIndex: z.number().int().min(0).max(3),
      isCorrect: z.boolean(),
      timeTakenMs: z.number().int().min(0),
    }),
  ),
})

export const loginSchema = z.object({
  email: z.string().email('auth.errors.emailInvalid'),
  password: z.string().min(8, 'auth.errors.passwordTooShort'),
})

export const signupSchema = z
  .object({
    email: z.string().email('auth.errors.emailInvalid'),
    password: z.string().min(8, 'auth.errors.passwordTooShort'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'auth.errors.passwordsMismatch',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.errors.emailInvalid'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'auth.errors.passwordTooShort'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'auth.errors.passwordsMismatch',
    path: ['confirmPassword'],
  })

export type CreateGameInput = z.infer<typeof createGameSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type PassingCardInput = z.infer<typeof passingCardSchema>
export type JoinGameInput = z.infer<typeof joinGameSchema>
export type SubmitScoreInput = z.infer<typeof submitScoreSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
