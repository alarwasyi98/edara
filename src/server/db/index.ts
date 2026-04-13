/**
 * Database Connection — Neon Serverless PostgreSQL + Drizzle ORM
 *
 * This module initializes the Drizzle ORM instance backed by Neon's
 * serverless driver. All server-side database access should import
 * `db` from this module.
 *
 * RLS Note: Before executing tenant-scoped queries, the middleware
 * must call `db.execute(sql\`SELECT set_config(...)\`)` to set
 * the `app.current_school` and `app.current_unit` session variables.
 * This is handled by the RLS middleware (Step 9).
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Create the Neon serverless SQL executor.
 * In production, DATABASE_URL is read from environment variables.
 * The connection is stateless (HTTP-based) — ideal for serverless.
 */
const sql = neon(process.env.DATABASE_URL!)

/**
 * Drizzle ORM instance with full schema type inference.
 * Use this for all database operations.
 *
 * @example
 * ```ts
 * import { db } from '@/server/db'
 * const teachers = await db.query.teachers.findMany({
 *   where: eq(teachers.unitId, unitId)
 * })
 * ```
 */
export const db = drizzle(sql, { schema })
