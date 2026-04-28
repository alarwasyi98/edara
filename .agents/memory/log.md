# Session Log — EDARA

> Layer 3: Episodic memory — what happened, when, and what changed.
> Append new sessions at the top. Never delete old entries.

---

## Session 14 — 2026-04-26: Finalisasi SPA Auth & PR ke `dev`

**Branch:** `feat/auth`
**PR:** https://github.com/alarwasyi98/edara/pull/9 (`feat/auth` → `dev`)

### What Happened
Blank page on dev server fixed. Three root causes found and resolved:
1. **Schema duplication in `users.ts`** — `userId` field defined twice, `userIdx` index defined twice, `t.userId` appeared twice in unique index → TypeScript error TS1117 blocked build entirely
2. **Better Auth `baseURL` invalid** — `auth-client.ts` used relative path `'/api/auth'` instead of absolute URL → runtime crash before React rendered
3. **Server deps leaked to client bundle** — `src/routes/api/auth/$.ts` imported `auth` → `db` → `neon()` → TanStack Router bundled server-side code into client

### Fixes Applied
- Removed duplicate properties in `src/server/db/schema/users.ts`
- Changed `baseURL` to `window.location.origin` in `src/lib/auth-client.ts`
- Deleted `src/routes/api/auth/$.ts` (SSR-only pattern incompatible with SPA)
- Updated `src/routeTree.gen.ts` to remove `/api/auth/$` references
- Added try/catch + error check in `getSession()` for graceful `null` return
- Added `.playwright-mcp/` to `.gitignore`

### Decisions
- Removed API auth route entirely (SSR-only, not SPA-compatible)
- `window.location.origin` as baseURL (safe in SPA, per Better Auth docs)
- `getSession()` returns `null` on error (route guard handles redirect)
- Created backup branch `feat/auth-backup-2026-04-26`

### Verification
All CI checks passed: format ✅, typecheck ✅, lint ✅ (8 warnings baseline), build ✅, tests ✅ (11 tests, 2 files). `/sign-in` and `/sign-up` render correctly. Route guard redirects work.

### Better Auth Audit (~40% complete)
- ✅ Auth schema correct (`user`, `session`, `account`, `verification`)
- ✅ Separation of concerns: Better Auth = identity, `user_school_assignments` = tenancy/RBAC
- ✅ Client layer clean and testable
- ✅ oRPC middleware scaffolding correct pattern
- ❌ No server runtime executing `betterAuth()` instance
- ❌ `src/lib/auth.ts` accessible from client (should be `src/server/`)
- ❌ `userSchoolAssignments.userId` missing FK to `user.id`
- ❌ Auth schema missing explicit `hashedPassword` column
- ❌ Admin router missing role checks
- ❌ Drizzle migration drift: snapshot has `user_id`, SQL `0000` still has `clerk_user_id`

---

## Session 13 — 2026-04-25: Better Auth Recovery on `feat/auth`

### What Happened
Recovery of Better Auth migration on `feat/auth` branch. White screen resolved, auth routes made consistent, CI checks passing, preview production bundle accessible.

### Key Fixes
- Removed duplicate `src/routes/auth/*` routes (kept canonical `/sign-in`, `/sign-up`, `/forgot-password`)
- Regenerated `src/routeTree.gen.ts` after route cleanup
- Added route guards: `/_authenticated` redirects to `/sign-in?redirect=...`; public auth pages redirect logged-in users to `/`
- Replaced mock auth (Zustand/cookie) with Better Auth client calls in sign-in/sign-up forms
- Removed `createServerFn` dependency (not compatible with Vite SPA)
- Removed `tanstackStartCookies()` plugin (leaked `@tanstack/start-server-core` to client build)
- Added `.worktrees` ignore for ESLint, Prettier, `.gitignore`
- Generated forward migration `drizzle/0002_next_power_pack.sql` for Better Auth tables

### Root Causes
1. Two auth route systems coexisted (root `(auth)` + new `src/routes/auth/*`)
2. API/import patterns assumed full TanStack Start runtime (not SPA)
3. Local worktree polluted lint results
4. Previous "fix" commits contained mismatched APIs

---

## Session 12 — 2026-04-24: Better Auth Migration Fixes

### What Happened
Build errors from Better Auth migration implementation fixed. 12 of 13 migration tasks completed successfully. Remaining build errors resolved.

### Fixes
- Installed `@tanstack/react-start` package
- Moved `generateId` to `advanced.database.generateId`
- Changed `.inputValidator()` to `.input(z.object(...))`
- Regenerated routeTree for new auth routes
- Added missing `createFileRoute` import
- Fixed TypeScript `any` types with proper Zod schemas

### Migration Tasks Completed (12/13)
Package deps, schema naming (`clerkUserId` → `userId`), Better Auth schema, auth config, auth handler route, session helpers, oRPC middleware, assignment helper, auth pages, Clerk route removal, admin user router, documentation update.

---

## Session 10 — 2026-04-22: Auth Spec Hardening

### What Happened
Auth specification hardened and canonicalized. Better Auth migration spec (`src/docs/better-auth-migration-spec.md`) established as the single source of truth for the Clerk → Better Auth migration.

---

## Sessions 8–9 — 2026-04-20/21: Auth Migration Design

### What Happened
Designed and specified the Clerk → Better Auth migration. Created canonical migration spec with architectural decision, responsibility split, data model strategy, integration design, and 8-phase implementation plan.

---

## Session 7 — 2026-04-19: Rollup Fix

### What Happened
Fixed rollup version conflict. Added `pnpm.overrides.rollup: "4.60.0"` to `package.json`.

---

## Session 6 — 2026-04-18: Naming Convention Refactoring

### What Happened
Refactored naming conventions from Indonesian to English for folders and routes. Sidebar labels kept in Indonesian (Option B convention). Created `naming-dictionary.json` mapping.

---

## Session 5 — 2026-04-17: DB Schema Optimization

### What Happened
Optimized database schema definitions. Refined table structures, indexes, and constraints.

---

## Session 4 — 2026-04-16: CI Remediation

### What Happened
Fixed CI pipeline. Established baseline: format check, typecheck, lint (max 10 warnings), build.

---

## Session 3 — 2026-04-15: Section 2 Execution

### What Happened
Executed Section 2 of implementation plan (Database Schema & RLS). Created 18 tables across 12 schema files. All Drizzle schemas defined.

---

## Session 2 — 2026-04-14: Section 2 Planning

### What Happened
Planned Section 2 implementation. Mapped technical specification schemas to Drizzle ORM definitions.

---

## Session 1 — 2026-04-13: Initial Stabilization

### What Happened
Initial project stabilization. Cleaned up legacy code, established project structure, set up development environment.

---

## Milestone Tracker

| Step | Description | Status |
|------|------------|--------|
| 1 | Out-of-scope cleanup (PPDB, Alumni) | ✅ Done |
| 2 | Backend dependencies installation | ✅ Done |
| 3 | Database & Drizzle config | ✅ Done |
| 4 | Core schema (Tenant, Unit, Academic Year) | ✅ Done |
| 5 | Operational schema (Teachers, Students, Classes) | ✅ Done |
| 6 | Financial schema (SPP, Cashflow, Events, Logs) | ✅ Done |
| 7 | RLS setup | ✅ Done |
| 8 | Auth integration & route guards | 🔄 In Progress (~40%) |
| 9 | Server middleware (auth context, RLS) | ❌ Not Started |
| 10 | Activity log middleware | ❌ Not Started |
| 11 | oRPC root router setup | ❌ Not Started |
| 12 | pg-boss configuration | ❌ Not Started |
| 13–27 | Domain migrations (Dashboard → Reports) | ❌ Not Started |
