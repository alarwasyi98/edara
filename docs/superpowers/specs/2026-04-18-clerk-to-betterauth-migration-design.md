---
name: clerk-to-betterauth-migration
description: Refined migration design from Clerk to Better Auth for EDARA
status: approved-for-planning
modified: 2026-04-19
version: 2.0.0
---

# Migration Design: Clerk -> Better Auth

**Date:** 2026-04-19
**Status:** Refined for implementation planning
**Version:** 2.0.0

---

## Overview

EDARA will replace Clerk with Better Auth before real auth is integrated into the application runtime.

This is best treated as a **provider replacement during pre-integration**, not as a live end-user migration:

- Clerk is present in dependencies, example routes, and technical docs
- Real backend auth, oRPC auth middleware, and production user onboarding are not fully implemented yet
- There are no existing production users to migrate

The goal is to establish a production-ready auth foundation that fits EDARA's existing architecture:

- **Better Auth** owns identity, credentials, sessions, and cookies
- **EDARA domain tables** own tenant membership, school/unit assignments, RBAC, and RLS context

---

## Key Decision

### Chosen Model

**Better Auth handles identity and session only.**

EDARA remains the source of truth for:

- `schools`
- `school_units`
- `user_school_assignments`
- app-specific roles (`super_admin`, `kepala_sekolah`, `admin_tu`, `bendahara`)
- active tenant/unit context used by RLS

### Why This Model Fits EDARA Best

1. EDARA already has a richer authorization model than a generic auth organization system.
2. The database and ADRs already center around app-owned tenant context and RLS.
3. Mapping Better Auth organizations to tenants would create duplicate access models and synchronization risk.
4. Because auth is not fully integrated yet, the safest move is replacing the provider without redesigning tenancy.

---

## Non-Goals

This migration does **not** include:

- redesigning EDARA tenancy from `school_id` to organization-based tenancy
- migrating live Clerk users
- enabling OAuth providers
- enabling email verification, password reset, or 2FA in MVP
- rewriting all historical technical docs in this phase

Those can be handled in follow-up documentation and later auth phases.

---

## Current State Summary

Based on repo review as of 2026-04-19:

- `package.json` still depends on `@clerk/backend` and `@clerk/clerk-react`
- `src/routes/clerk/*` contains a modular Clerk example flow
- `src/routeTree.gen.ts` still includes `/clerk/*` routes
- `src/server/db/schema/users.ts` still uses `clerk_user_id`
- auth in the main app is still mock-oriented in places such as `src/stores/auth-store.ts`
- `README.md`, `technical-specification.md`, `reconciliation-plan.md`, and system instructions still describe Clerk as the auth provider

Conclusion: the codebase contains **Clerk scaffolding and documentation debt**, not a deeply integrated production auth system.

---

## Target Architecture

### Responsibility Split

| Concern | Owner |
|---|---|
| Sign up / sign in / session lifecycle | Better Auth |
| Password hashing / credential management | Better Auth |
| Session cookie issuance and validation | Better Auth |
| User identity (`user.id`) | Better Auth |
| School assignment | EDARA |
| Unit assignment | EDARA |
| Role assignment | EDARA |
| RLS session variables | EDARA |
| Activity log actor references | EDARA, using Better Auth user id |

### High-Level Flow

```text
Browser
  -> custom sign-in/sign-up UI
  -> Better Auth client/server endpoints
  -> session cookie

TanStack Start / oRPC
  -> validate session through Better Auth
  -> resolve EDARA assignment from user_school_assignments
  -> set Postgres RLS context
  -> execute application procedures
```

---

## Data Model Strategy

### Better Auth Data

Better Auth should own its standard auth tables for:

- users
- sessions
- accounts
- verifications

Use the Better Auth Drizzle adapter and generate the schema/migration with the official CLI flow.

### EDARA Data

EDARA keeps the existing assignment model, but changes the auth identifier naming from Clerk-specific to provider-neutral.

### Required Schema Refinement

**File:** `src/server/db/schema/users.ts`

Current field:

- `clerkUserId`
- database column `clerk_user_id`
- index names tied to Clerk

Refine to:

- property: `userId`
- database column: `user_id`
- index names updated to provider-neutral names

Example target shape:

```ts
export const userSchoolAssignments = pgTable(
  'user_school_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    schoolId: uuid('school_id').references(() => schools.id).notNull(),
    unitId: uuid('unit_id').references(() => schoolUnits.id),
    role: userRoleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolIdx: index('user_assignments_school_idx').on(t.schoolId),
    userIdx: index('user_assignments_user_idx').on(t.userId),
    uniqueAssignment: uniqueIndex('user_assignment_unique').on(
      t.userId,
      t.schoolId,
      t.unitId,
    ),
  }),
)
```

### Important Note on Other Tables

Fields such as:

- `changed_by`
- `recorded_by`
- `created_by`
- `actor_id`

can continue storing the authenticated user id as a string, but comments and docs should stop referring to them as `clerkUserId`.

---

## Better Auth Integration Design

### Auth Configuration

Create an auth module using:

- `better-auth`
- `@better-auth/drizzle-adapter`
- `tanstackStartCookies()` plugin for TanStack Start

Use Better Auth for:

- email/password auth
- session retrieval on server
- cookie management for TanStack Start

### Routing Model

Mount Better Auth handlers under:

- `/api/auth/*`

Recommended files:

- `src/lib/auth.ts` or `src/server/auth/index.ts`
- `src/routes/api/auth/$.ts`

### Session Access

The application should expose thin helpers such as:

- `getSession()`
- `requireSession()`
- `getCurrentAssignment()`
- `requireAssignment()`

These helpers should:

1. read the Better Auth session from request headers/cookies
2. resolve EDARA assignment records from `user_school_assignments`
3. return a normalized auth context for downstream middleware and procedures

---

## Authorization and RLS Design

### Source of Truth

Authorization must come from `user_school_assignments`, not from Better Auth organization roles.

### Recommended Auth Context

After session validation, EDARA should build an auth context like:

```ts
type AuthContext = {
  userId: string
  email: string
  schoolId: string | null
  unitId: string | null
  role: 'super_admin' | 'kepala_sekolah' | 'admin_tu' | 'bendahara' | null
  assignmentId: string | null
}
```

### RLS Requirement

RLS context must continue to be set by EDARA within transaction/request scope. Do not rely on global process state.

The migration must preserve the ADR direction that tenant isolation is enforced in Postgres through request-scoped context, not only in application code.

### Important Correction to Earlier Draft

The earlier draft used ad hoc `SET app.current_*` examples outside a transaction pattern. Implementation should instead follow the repo ADR direction and set request-scoped database config in the same controlled access layer used by the app's DB procedures.

---

## UI and UX Design

### Auth Pages

Replace the Clerk example pages with custom auth pages using the existing design system:

- `/auth/sign-in`
- `/auth/sign-up`

Pages should use:

- shadcn/ui inputs, buttons, labels, alerts
- `react-hook-form`
- `zod`

### MVP Behavior

Sign-up:

- user creates identity in Better Auth
- no automatic school/unit/role assignment
- user lands in an onboarding-safe state

Sign-in:

- if the user has at least one active EDARA assignment, continue into the app
- if the user has no active assignment, show a clear "awaiting access" state instead of granting tenant access

### User Management

The app should provide an EDARA-managed user administration flow for:

- listing users known to the app
- linking Better Auth user identities to assignments
- assigning school
- assigning unit
- assigning role
- activating/deactivating assignment

This is not the same as Better Auth account administration. Better Auth owns identity records; EDARA owns access records.

---

## Migration Strategy

Because there are no live users, the migration should be treated as a **replacement rollout**, not a dual-provider migration.

### What Changes Immediately

- Clerk packages removed
- Clerk example routes removed
- Better Auth packages added
- Better Auth handler mounted
- schema renamed from Clerk-specific identifiers to provider-neutral identifiers
- mock auth flow begins transition toward real session-based auth

### What Can Stay Deferred Briefly

- full admin user-management UX polish
- email verification
- forgot password
- 2FA
- OAuth
- full documentation sweep across every historical doc

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Mixing Better Auth org concepts with EDARA tenancy | High | Do not use organization plugin as the tenancy source of truth in Phase 1 |
| Provider-specific naming remains in schema/comments/docs | Medium | Rename schema fields and comments now; schedule wider docs cleanup |
| Mock auth store and real session state diverge | High | Replace mock auth entry points with a single session-aware auth context |
| RLS context set inconsistently | High | Centralize session -> assignment -> DB context resolution |
| Over-scoping auth with Phase 2 features | Medium | Keep MVP to email/password + assignment-gated access |

---

## Refined Acceptance Criteria

- [ ] Users can sign up with email and password through Better Auth
- [ ] Users can sign in with email and password through Better Auth
- [ ] Session persists across refresh via secure cookies
- [ ] Unauthenticated users are redirected to `/auth/sign-in`
- [ ] Authenticated users without assignments do not gain tenant access
- [ ] Authenticated users with assignments receive correct school/unit/role context
- [ ] `user_school_assignments` no longer uses Clerk-specific identifier naming
- [ ] Clerk example routes and dependencies are removed
- [ ] App auth middleware resolves Better Auth session plus EDARA assignment together
- [ ] RLS context continues to be set from EDARA assignment data

---

## What This Design Changes from v1.1

1. Removes Better Auth Organizations as the recommended multi-tenancy model.
2. Reframes the work as provider replacement before full auth integration, not a live migration.
3. Replaces Clerk-specific identifier naming with provider-neutral naming.
4. Clarifies that EDARA, not Better Auth, owns RBAC and tenant context.
5. Aligns TanStack Start integration with Better Auth's current handler/cookie plugin guidance.

---

## Follow-Up Documentation Needed

This design intentionally leaves a second documentation pass for:

- `README.md`
- `.agents/rules/system-instructions.md`
- `src/docs/technical-specification.md`
- `src/docs/reconciliation-plan.md`

Those files still describe Clerk and should be updated during implementation or immediately after the auth foundation lands.

---

## External References

- [Better Auth TanStack Start Integration](https://better-auth.com/docs/integrations/tanstack)
- [Better Auth Drizzle Adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)

---

**End of Design Document**
