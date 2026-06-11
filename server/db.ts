import { PrismaClient } from '@prisma/client'

// Prisma client singleton. Avoids exhausting DB connections during dev/HMR
// where the module may be re-evaluated repeatedly.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
