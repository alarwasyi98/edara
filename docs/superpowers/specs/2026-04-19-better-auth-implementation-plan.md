---
name: better-auth-implementation-plan
description: Implementation plan for replacing Clerk with Better Auth in EDARA
status: ready
modified: 2026-04-19
version: 1.0.0
---

# Implementation Plan: Better Auth Foundation for EDARA

**Date:** 2026-04-19
**Scope:** Replace Clerk scaffolding with Better Auth and establish EDARA-owned authorization

---

## Execution Principles

1. Treat this as a provider replacement, not a live user migration.
2. Keep Better Auth limited to identity and session.
3. Keep EDARA tables as the source of truth for school/unit/role access.
4. Preserve ADR constraints around client-side data fetching, RLS, and activity logging.
5. Prefer thin, centralized auth helpers over auth logic scattered across routes and routers.

---

## Phase 1: Preparation and Design Lock

### Goals

- finalize the auth model
- define file ownership and rollout order
- avoid mixing tenancy redesign into auth replacement

### Tasks

| Step | Task | Output |
|---|---|---|
| 1.1 | Confirm Better Auth is identity/session only | Design baseline locked |
| 1.2 | Identify all Clerk references in code and docs | Replacement inventory |
| 1.3 | Identify all mock auth entry points | Mock-to-real migration list |
| 1.4 | Define normalized auth context shape | Shared server auth contract |

### Exit Criteria

- provider model is agreed
- Clerk touchpoints are enumerated
- implementation order is fixed

---

## Phase 2: Dependency and Schema Foundation

### Goals

- remove Clerk packages
- install Better Auth packages
- neutralize provider-specific schema naming

### Tasks

| Step | Task | Files |
|---|---|---|
| 2.1 | Remove `@clerk/backend` and `@clerk/clerk-react` | `package.json` |
| 2.2 | Add `better-auth` and `@better-auth/drizzle-adapter` | `package.json` |
| 2.3 | Add any required Better Auth CLI/dev support | `package.json` if needed |
| 2.4 | Rename `clerkUserId` -> `userId` in assignment schema | `src/server/db/schema/users.ts` |
| 2.5 | Update index names/comments tied to Clerk | `src/server/db/schema/users.ts` and related schema comments |
| 2.6 | Generate migration for schema rename plus auth tables | `drizzle/*` |

### Notes

- Do not use direct database pushes as the primary production path if tracked migrations are required by project practice.
- Keep migration history explicit and reviewable.

### Exit Criteria

- dependencies install cleanly
- schema compiles
- migration files are generated and reviewable

---

## Phase 3: Better Auth Server Integration

### Goals

- mount Better Auth in TanStack Start
- make session retrieval available to server-side code

### Tasks

| Step | Task | Files |
|---|---|---|
| 3.1 | Create auth config with Drizzle adapter | `src/lib/auth.ts` or `src/server/auth/index.ts` |
| 3.2 | Add TanStack Start cookies plugin | auth config file |
| 3.3 | Mount auth handler at `/api/auth/$` | `src/routes/api/auth/$.ts` |
| 3.4 | Create session helper functions | `src/server/auth/*` or `src/lib/auth.functions.ts` |
| 3.5 | Add typed auth context contract | shared auth types file |

### Recommended Helper Set

- `getSession()`
- `requireSession()`
- `getUserAssignments(userId)`
- `getPrimaryAssignment(userId)` or equivalent selection rule
- `requireAssignment()`

### Exit Criteria

- Better Auth endpoints respond
- server code can resolve the current user session reliably

---

## Phase 4: Authorization and RLS Bridge

### Goals

- join Better Auth identity to EDARA access control
- centralize tenant context resolution

### Tasks

| Step | Task | Files |
|---|---|---|
| 4.1 | Build auth middleware that validates session | `src/server/middleware/auth.ts` |
| 4.2 | Build assignment resolution helper from `user_school_assignments` | auth/middleware layer |
| 4.3 | Build role-check helper based on EDARA roles | auth/middleware layer |
| 4.4 | Build request-scoped RLS context setter | DB/auth integration layer |
| 4.5 | Ensure oRPC procedures consume unified auth context | router base/procedure files |

### Design Rule

Do not infer authorization from Better Auth metadata if EDARA assignment data exists. The assignment table wins.

### Exit Criteria

- protected procedures can reject unauthenticated users
- protected procedures can reject unassigned users
- DB access can run under the correct school/unit context

---

## Phase 5: Frontend Auth Flow Replacement

### Goals

- replace Clerk example routes
- replace mock sign-in behavior with Better Auth-backed behavior

### Tasks

| Step | Task | Files |
|---|---|---|
| 5.1 | Create `/auth` route group | `src/routes/auth/*` |
| 5.2 | Build sign-in page with `react-hook-form` + `zod` | `src/routes/auth/(auth)/sign-in.tsx` |
| 5.3 | Build sign-up page with `react-hook-form` + `zod` | `src/routes/auth/(auth)/sign-up.tsx` |
| 5.4 | Add unauthenticated layout if needed | `src/routes/auth/(auth)/route.tsx` |
| 5.5 | Add protected route guard behavior | auth route/layout files |
| 5.6 | Replace mock auth-store usage in sign-in flow | `src/stores/auth-store.ts`, auth features, `src/main.tsx` |
| 5.7 | Add "awaiting access" screen for authenticated users without assignment | auth/onboarding route or guarded layout |
| 5.8 | Remove `src/routes/clerk/*` | route files |
| 5.9 | Regenerate `src/routeTree.gen.ts` | generated file |

### Exit Criteria

- users can sign in and sign up through `/auth/*`
- mock token login is gone
- Clerk routes no longer exist

---

## Phase 6: User Access Administration

### Goals

- allow EDARA admins to grant actual access after identity creation

### Tasks

| Step | Task | Files |
|---|---|---|
| 6.1 | Define user listing source for admin UI | auth/users router design |
| 6.2 | Build admin query for users plus assignments | `src/server/routers/*` |
| 6.3 | Build mutation for role/school/unit assignment | `src/server/routers/*` |
| 6.4 | Build or adapt user management UI | route/feature files |
| 6.5 | Support activate/deactivate assignment | router + UI |

### Important Clarification

This phase manages EDARA access records, not password resets, profile edits, or generic identity administration.

### Exit Criteria

- admin can assign school/unit/role
- assignment changes affect access behavior correctly

---

## Phase 7: Documentation Alignment

### Goals

- remove Clerk as the documented source of truth
- align project docs with the new auth architecture

### Tasks

| Step | Task | Files |
|---|---|---|
| 7.1 | Update setup and env docs | `README.md`, `.env.example` |
| 7.2 | Update architecture rules referencing Clerk | `.agents/rules/system-instructions.md` |
| 7.3 | Update technical specification auth sections | `src/docs/technical-specification.md` |
| 7.4 | Update reconciliation plan auth steps | `src/docs/reconciliation-plan.md` |
| 7.5 | Log implementation outcomes | `src/docs/reconciliation-log.md` |

### Exit Criteria

- no primary project doc incorrectly states Clerk is the target auth provider

---

## Phase 8: Verification

### Required Checks

Run in project order where practical:

1. `pnpm format:check`
2. `pnpm typecheck`
3. `pnpm lint --max-warnings 10`
4. `pnpm build`

### Functional Verification

- sign up creates Better Auth user
- sign in sets session cookie
- refresh preserves session
- unauthenticated access redirects to sign-in
- authenticated but unassigned user is blocked from tenant data
- assigned user gets correct access
- role checks enforce EDARA roles

### Suggested Test Coverage

- unit tests for auth helpers and role guards
- integration tests for session + assignment resolution
- route-level tests for protected navigation

---

## Rollout Notes

Because this app has not fully integrated real auth yet, rollout can be done in a single branch without a dual-provider period if verification is completed before merge.

Use a temporary parallel path only if implementation uncovers hidden runtime coupling to the Clerk example routes.

---

## Sequencing Recommendation

Recommended execution order:

1. dependencies and schema
2. Better Auth server mount
3. session and assignment helpers
4. route/UI replacement
5. admin assignment flow
6. docs cleanup
7. verification

This order reduces rework because middleware and UI can be built against the normalized auth context instead of raw provider APIs.

---

## Definition of Done

- Better Auth is the only auth provider dependency in the app
- Clerk example code is removed
- EDARA assignment schema uses provider-neutral naming
- auth flow is session-based, not mock-token based
- authorization is resolved from `user_school_assignments`
- RLS context remains compatible with EDARA's tenancy model
- core docs no longer instruct future work to integrate Clerk

---

**End of Implementation Plan**
