# Decisions Log — EDARA

> Layer 2: Architecture Decision Records (ADRs) with rationale.
> Each entry is immutable once recorded. New decisions append; old ones are never deleted.

---

## ADR-01: Vite SPA Mode (No SSR)

- **Date:** 2026-03 (project inception)
- **Status:** Active
- **Context:** TanStack Start supports both SSR and SPA modes. Phase 1 focuses on admin panel functionality without SEO requirements.
- **Decision:** Run TanStack Start in Vite SPA mode. No server-side rendering.
- **Consequences:**
  - No `loader` functions or `getServerSideProps` patterns
  - All data fetching via oRPC + TanStack Query on the client
  - Simpler deployment (static hosting possible)
  - Trade-off: No SEO, no server-side data prefetching

## ADR-02: Shared Schema Multi-Tenancy with RLS

- **Date:** 2026-03
- **Status:** Active
- **Context:** EDARA serves multiple madrasah (schools). Need tenant isolation without separate databases.
- **Decision:** Use shared PostgreSQL schema with Row Level Security (RLS). Every tenant-scoped table has `school_id` column. RLS policies enforce isolation via `current_setting('app.current_school')`.
- **Consequences:**
  - Every entity table MUST have `school_id` (and `unit_id` if unit-scoped)
  - Drizzle middleware must call `set_config('app.current_school', schoolId)` before queries
  - Single database, simpler ops
  - Risk: RLS misconfiguration could leak data across tenants

## ADR-03: Computed Financial Status (Never Stored)

- **Date:** 2026-03
- **Status:** Active
- **Context:** SPP payment status (paid/partial/unpaid) could be stored as a column or computed dynamically.
- **Decision:** NEVER store payment status as a static column. Always compute via SQL aggregation (`SUM(amount)` vs `net_amount`).
- **Consequences:**
  - No stale status data
  - Slightly more complex queries
  - Status always reflects real-time transaction state
  - Payment matrix UI relies on server-computed status

## ADR-04: Append-Only Financial Transactions

- **Date:** 2026-03
- **Status:** Active
- **Context:** Financial records require audit trail integrity. UPDATE/DELETE on transaction records destroys history.
- **Decision:** `payment_transactions` table has NO UPDATE or DELETE at application level. Corrections use new transactions with type `reversal` linked via `reversedById`.
- **Consequences:**
  - `payment_transactions` has no `updated_at` column
  - Reversal transactions create new rows, not modify existing
  - Complete audit trail preserved
  - UI shows reversed transactions with strikethrough styling

## ADR-05: Centralized Activity Logging via Middleware

- **Date:** 2026-03
- **Status:** Active
- **Context:** Activity logs are required for compliance. Manual `db.insert(activityLogs)` calls are error-prone and inconsistent.
- **Decision:** Use `withActivityLog` middleware on oRPC procedures. No manual log inserts inside mutation blocks.
- **Consequences:**
  - Consistent log format across all mutations
  - Developers configure `ActivityLogConfig` per procedure
  - `getEntityId` callback extracts entity ID from mutation result
  - Logs capture actor, action, entity, and metadata automatically

## ADR-06: Subjects as JSON Array (No Junction Table)

- **Date:** 2026-03
- **Status:** Active
- **Context:** Teachers have multiple subjects (`mataPelajaran`). Could use junction table or JSON column.
- **Decision:** Store `mataPelajaran` as JSON array in text column on `teachers` table.
- **Consequences:**
  - Simpler schema (no extra table)
  - No referential integrity on subject values
  - Querying by subject requires JSON operators
  - Acceptable trade-off for Phase 1 scope

## ADR-07: Mandatory decimal.js for Financial Precision

- **Date:** 2026-03
- **Status:** Active
- **Context:** JavaScript floating-point arithmetic causes rounding errors in financial calculations.
- **Decision:** FORBIDDEN to use `Number()`, `parseInt`, `parseFloat`, or native JS arithmetic for financial logic. MUST use `decimal.js`. Database columns use `numeric(15,2)`.
- **Consequences:**
  - All money values flow as strings from PostgreSQL `numeric` type
  - Frontend initializes with `new Decimal(value)` for computation
  - `formatRupiah` formatter accepts `Decimal` instances
  - Zod validators convert number/string inputs to decimal-safe strings

## C7: Auth Provider — Better Auth (Migration from Clerk)

- **Date:** 2026-04
- **Status:** Active (migration ~40% complete)
- **Context:** Originally used Clerk for authentication. Migrated to Better Auth for self-hosted control and cost reduction.
- **Decision:** Better Auth handles identity and session management. EDARA handles tenancy and RBAC via `user_school_assignments` table.
- **Consequences:**
  - Schema renamed `clerkUserId` → `userId`
  - Better Auth tables: `user`, `session`, `account`, `verification`
  - Route mount: `/api/auth/$` (currently removed due to SPA constraints)
  - Client SDK: `@better-auth/client`
  - Server runtime not yet functional (needs backend scaffold)
  - oRPC middleware pattern: `context.ts` → `auth.ts` → `authorized.ts`

## C3: pg-boss Colocated (Same Process)

- **Date:** 2026-03
- **Status:** Active
- **Context:** Phase 1 needs background job processing (bulk imports, report generation) without separate worker infrastructure.
- **Decision:** Run pg-boss in the same server process (colocated). Separate worker process deferred to Phase 2.
- **Consequences:**
  - Simpler deployment
  - Job processing shares server resources
  - Schema: `pgboss` in PostgreSQL
  - Used for: teacher bulk import, bill generation, report export

## C6: Student Status Transitions

- **Date:** 2026-03
- **Status:** Active
- **Context:** Students go through lifecycle states (active, graduated, transferred, dropped out). Need audit trail.
- **Decision:** Status changes write to `enrollment_status_history` table. Students are never permanently deleted (soft lifecycle).
- **Consequences:**
  - `enrollments` table has current status
  - `enrollment_status_history` records every transition with metadata
  - Transfer requires destination school info
  - Graduation is a terminal state

## C9: Session Management Strategy

- **Date:** 2026-04
- **Status:** Active
- **Context:** SPA needs session management without SSR server-side session handling.
- **Decision:** Better Auth client-side session with cookie baseline. `getSession()` returns `null` on error (graceful degradation). Route guards redirect to `/sign-in?redirect=...`.
- **Consequences:**
  - No server-side session validation in Phase 1 SPA
  - Client checks session on route navigation
  - Backend oRPC will validate session tokens when implemented
