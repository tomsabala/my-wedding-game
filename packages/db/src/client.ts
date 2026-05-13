import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Reuse the client across hot reloads (dev) and warm Lambda invocations (prod).
// Without this, every warm invocation creates a new PrismaClient which pays
// the ~1s TCP connection establishment cost before the first query.
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
globalForPrisma.prisma = prisma
