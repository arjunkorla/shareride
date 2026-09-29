import { PrismaClient } from '@prisma/client'

// One PrismaClient per process. NestJS wraps this in a scoped provider
// (see apps/api/src/prisma) rather than importing this singleton directly
// in request handlers.
export const prisma = new PrismaClient()

export * from '@prisma/client'
