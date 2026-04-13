/**
 * Database Schema Barrel File
 *
 * All Drizzle table definitions are re-exported from this file.
 * Drizzle Kit and the db instance both point here.
 */

// Step 4: Core Tenant Schema
export * from './schools'
export * from './users'
export * from './academic-years'

// Step 5: Operational Schema
export * from './teachers'
export * from './students'
export * from './classes'
export * from './enrollments'

// Step 6: Financial & Log Schema
export * from './spp'
export * from './cashflow'
export * from './events'
export * from './logs'
