/**
 * Prisma Database Service
 * 
 * This is the NestJS PrismaService equivalent: extends the generated client,
 * instantiated once as a singleton. Cached across HMR reloads in dev.
 * 
 * @module Server/DB
 */

import 'server-only';
import { PrismaClient } from '@prisma/client';

/**
 * Database class extending PrismaClient
 * Adds custom configuration and can be extended with custom methods
 */
class Database extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
}

// Global variable for database instance
// This ensures we have only one instance per process (singleton pattern)
// In development with HMR, this prevents multiple instances from being created
const globalForDb = globalThis as unknown as {
  db?: Database;
};

/**
 * Singleton instance of the Prisma database client
 * 
 * Usage:
 * ```typescript
 * import { prisma } from '@/server/db';
 * 
 * // Use prisma in your services
 * const charges = await prisma.charge.findMany();
 * ```
 */
export const prisma = globalForDb.db ?? new Database();

// Cache the instance in development for HMR
if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = prisma;
}

// Re-export Prisma types for convenience
export type { Prisma } from '@prisma/client';
export { PrismaClient } from '@prisma/client';
