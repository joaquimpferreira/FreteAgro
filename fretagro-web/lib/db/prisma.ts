// Prisma singleton client — lib/db/prisma.ts
// Layer: lib — safe to import from server-side code only.
// Uses a global singleton to avoid exhausting DB connections in development
// due to hot module reloading (standard Next.js pattern).

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
