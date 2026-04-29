# Implementation Log — EDARA

> Running log of completed implementation steps. Each entry records what was done, key decisions, files touched, and verification results.

---

## Step 0: Migrate Vite SPA to TanStack Start SPA Mode

- **Date:** 2026-04-29
- **Commit:** `2247d7b`
- **Summary:** Converted build pipeline from plain Vite + TanStack Router plugin to TanStack Start SPA mode with Nitro server runtime. Enables file-based API routes (`src/routes/api/**`) while keeping client-rendered SPA behavior.
- **Key Changes:**
  - Rewrote `vite.config.ts`: `tanstackStart({ spa: { enabled: true } })` + `nitro()` + `viteReact()`
  - Created `src/router.tsx` (getRouter factory) and `src/server.ts` (createServerEntry)
  - Rewrote `src/routes/__root.tsx` with full HTML document structure, `<HeadContent />`, `<Scripts />`
  - Deleted `index.html` (replaced by `__root.tsx`)
  - Gutted `src/main.tsx` (Start manages entry points)
  - Moved `@tanstack/react-start` from devDeps to deps, added `nitro`
- **Verification:** `pnpm build` passes. Dev server runs. All existing routes work.

---

## Step 8: Better Auth Server Setup

- **Date:** 2026-04-29
- **Commit:** `5183e5e`
- **Summary:** Complete Better Auth server configuration with Drizzle adapter, email/password provider, and schema fixes.
- **Key Changes:**
  - Moved `src/lib/auth.ts` to `src/server/auth/index.ts`
  - Fixed `userSchoolAssignments.userId` FK reference to `user.id`
  - Fixed Drizzle migration drift (`clerk_user_id` to `user_id`)
  - Normalized role names: `admin` to `super_admin`, `tata_usaha` to `admin_tu`
  - Updated `src/lib/auth-client.ts` import path
- **Verification:** `pnpm build` passes. TypeScript clean.

---

## Step 9: Auth API Route Handler

- **Date:** 2026-04-29
- **Commit:** _(pending — in working tree)_
- **Summary:** Created Better Auth HTTP handler as a TanStack Start API route, making auth functional at runtime.
- **Key Changes:**
  - Created `src/routes/api/auth/$.ts` — catch-all route delegating to `auth.handler` via `createFileRoute` + `server.handlers`
  - Verified `src/server/auth/index.ts` exports handler
  - Verified `src/lib/auth-client.ts` baseURL points to `/api/auth`
- **Verification:** `pnpm dev` — `curl http://localhost:3000/api/auth/ok` returns `{"ok":true}`. TypeScript clean.
- **Resolved Issues:** Known Issue #4 (Better Auth server was dead code).

---

## Step 10: oRPC Auth Middleware Stack

- **Date:** 2026-04-29
- **Commit:** _(pending — in working tree)_
- **Summary:** Built the complete oRPC middleware chain: auth session validation, assignment resolution with RLS, RBAC guard, and centralized activity logging.
- **Files Created (4):**
  - `src/server/routers/middlewares/require-unit-context.ts` — resolves assignment via `resolveAssignment()`, wraps downstream in `db.transaction()` for Neon HTTP compatibility, executes `SET LOCAL app.current_school/unit` for RLS (ADR-02), injects `schoolId`, `unitId`, `role`, `assignmentId`, `tx` into context
  - `src/server/routers/middlewares/require-role.ts` — factory `requireRole(allowedRoles: Role[])`, RBAC guard throwing `ORPCError('FORBIDDEN')`
  - `src/server/routers/middlewares/with-activity-log.ts` — post-hook pattern: awaits `next()`, then inserts into `activityLogs` table (ADR-05). Catches log errors silently.
  - `src/server/routers/middlewares/index.ts` — barrel export for all middleware
- **Files Modified (2):**
  - `src/server/routers/authorized.ts` — chains `auth` + `requireUnitContext`, expanded `AuthContext` type with EDARA fields (`schoolId`, `unitId`, `role`, `assignmentId`, `tx`)
  - `src/server/routers/admin/users.ts` — uses `adminAuthorized` with `requireRole(['super_admin', 'kepala_sekolah'])`, all queries via `context.tx`
- **Key Design Decision:** Neon HTTP driver is stateless — `SET LOCAL` only persists within a transaction. Solution: `requireUnitContext` wraps all downstream execution inside `db.transaction()` and passes the transaction instance (`tx`) via context so all queries share the same connection with RLS vars set.
- **Middleware Chain Order:** `context.ts` (headers) -> `auth.ts` (session/user) -> `require-unit-context.ts` (assignment + RLS + tx) -> `require-role.ts` (RBAC) -> `with-activity-log.ts` (post-hook logging)
- **Verification:** `npx tsc --noEmit` — zero errors.
- **Resolved Issues:** Known Issue #13 (`authorized.ts` missing EDARA fields).

---

## Steps 9–10 Commit + DB Fix

- **Date:** 2026-04-29
- **Commit:** `96f7e03` — `feat: auth API route + oRPC middleware stack (Steps 9-10)`
- **DB:** Dropped and recreated Neon schema (uuid type mismatch from old Clerk setup), re-ran `db:push`.

---

## Step 11: Frontend Auth Flow & Stores

- **Date:** 2026-04-29
- **Commit:** _(pending)_
- **Summary:** Replaced mock auth/tenant stores with real Better Auth integration.
- **Key Changes:**
  - Rewrote `auth-store.ts` — real `AuthUser`/`AuthSession`, `setSession()`/`reset()`
  - Rewrote `tenant-store.ts` — `TenantAssignment` with school/unit/role, persisted
  - Rewrote `use-tenant.ts` hook and `tenant-switcher.tsx` for assignment-based data
  - Enhanced `auth.functions.ts` — `getSession()`/`signInEmail()` populate store, `signOut()` clears it
  - Updated sign-in/sign-up forms with proper `result.error` handling
  - Updated `nav-user.tsx` (dynamic initials), `app-sidebar.tsx` (real user data)
- **Verification:** `npx tsc --noEmit` — zero errors. No stale references to old store API.

---

## Hotfix: Auth Login Failure

- **Date:** 2026-04-29
- **Problem:** Sign-up succeeded but sign-in returned "Invalid Email or Password". Drizzle Studio showed empty tables.
- **Root Causes:**
  1. `account` table missing `password` column — Better Auth had nowhere to store password hashes
  2. `.env` pointed to production DB (crimson-night), `.env.local` to dev DB (green-resonance) — schema push and runtime hit different databases
- **Fix:**
  - Added `password: varchar(255)` to `account` schema in `auth.ts`
  - Aligned `.env` `DATABASE_URL` to dev branch (green-resonance)
  - Ran `db:push` — applied `ALTER TABLE "account" ADD COLUMN "password"`
- **Action Required:** Restart dev server, register a new user (old user has no password hash).
