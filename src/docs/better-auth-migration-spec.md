---
name: better-auth-migration-spec
description: Canonical source of truth for replacing Clerk with Better Auth in EDARA
status: ready-for-implementation
modified: 2026-04-20
version: 1.1.0
---

# Better Auth Migration Spec

**Date:** 2026-04-20
**Status:** Canonical implementation source of truth
**Scope:** Replace Clerk scaffolding with Better Auth and establish EDARA-owned authorization

---

## 1. Executive Summary

EDARA will replace Clerk with Better Auth before real auth is fully integrated into the application runtime.

This work must be treated as a **provider replacement during pre-integration**, not as a live end-user migration:

- Clerk exists today in dependencies, example routes, schema naming, and documentation
- real backend auth, oRPC auth middleware, and production-grade session flow are not fully implemented yet
- there are no live production Clerk users that need account migration

The target architecture is:

- **Better Auth** owns identity, credentials, sessions, and cookies
- **EDARA domain tables** own school membership, unit membership, RBAC, and RLS context

This document merges the previous design rationale and implementation plan into one canonical spec.

---

## 2. Current State

Based on repo review:

- `package.json` still depends on `@clerk/backend` and `@clerk/clerk-react`
- `src/routes/clerk/*` contains a modular Clerk example flow
- `src/routeTree.gen.ts` still includes `/clerk/*` routes
- `src/server/db/schema/users.ts` still uses Clerk-specific identifier naming
- `vite.config.ts` still includes `@clerk/clerk-react` in vendor chunk configuration
- `drizzle/meta/*.json` snapshots still contain `clerk_user_id`
- schema comments in files such as `spp.ts`, `logs.ts`, `events.ts`, `enrollments.ts`, and `cashflow.ts` still reference Clerk-era actor/user id wording
- parts of app auth still rely on mock behavior such as `src/stores/auth-store.ts`
- project docs still describe Clerk as the target provider

Conclusion:

- the repository contains **Clerk scaffolding plus documentation debt**
- it does **not** yet contain a deeply integrated production auth system

---

## 3. Final Architectural Decision

### 3.1 Chosen Auth Model

**Better Auth handles identity and session only.**

EDARA remains the source of truth for:

- `schools`
- `school_units`
- `user_school_assignments`
- app-specific roles:
  - `super_admin`
  - `kepala_sekolah`
  - `admin_tu`
  - `bendahara`
- active school/unit context used by RLS

### 3.2 Why This Is the Right Fit

1. EDARA already has a richer authorization model than a generic auth organization model.
2. The existing schema and ADRs already center on app-owned tenant context and RLS.
3. Mapping Better Auth Organizations to tenants would create a second access model and introduce sync risk.
4. Because auth is not fully integrated yet, the safest migration is replacing the provider without redesigning tenancy.

### 3.3 Explicit Rejection

For Phase 1, **do not use Better Auth Organizations as the source of truth for EDARA multi-tenancy**.

That means:

- no organization-driven tenant access model
- no org role mapping as the primary RBAC system
- no duplication of tenant membership rules between Better Auth and EDARA

---

## 4. Non-Goals

This phase does **not** include:

- redesigning tenancy from `school_id` to organization-based tenancy
- migrating live Clerk users
- enabling OAuth providers
- enabling email verification in MVP
- enabling password reset in MVP
- enabling two-factor authentication in MVP
- fully rewriting every historical document before implementation starts

These can be handled later once the auth foundation is stable.

---

## 5. Responsibility Split

| Concern                                 | Owner                           |
| --------------------------------------- | ------------------------------- |
| sign up / sign in                       | Better Auth                     |
| password hashing and credential storage | Better Auth                     |
| session issuance and validation         | Better Auth                     |
| session cookies                         | Better Auth                     |
| identity user id                        | Better Auth                     |
| school access assignment                | EDARA                           |
| unit access assignment                  | EDARA                           |
| role assignment                         | EDARA                           |
| access checks inside app                | EDARA                           |
| database RLS context                    | EDARA                           |
| activity log actor references           | EDARA using Better Auth user id |

---

## 6. Target Runtime Flow

```text
Browser
  -> custom auth pages
  -> Better Auth endpoint/handler
  -> session cookie

TanStack Start / oRPC
  -> read Better Auth session
  -> resolve EDARA assignment from user_school_assignments
  -> build normalized auth context
  -> set request-scoped RLS context
  -> run protected procedures and queries
```

---

## 7. Data Model Strategy

### 7.1 Better Auth Data

Better Auth should own its standard auth tables for:

- users
- sessions
- accounts
- verifications

Use the official Better Auth Drizzle integration path to generate schema and migrations.

### 7.2 EDARA Data

EDARA keeps ownership of access and authorization through `user_school_assignments`.

### 7.3 Required Schema Refinement

**File:** `src/server/db/schema/users.ts`

Current state:

- property: `clerkUserId`
- column: `clerk_user_id`
- index names tied to Clerk

Target state:

- property: `userId`
- column: `user_id`
- provider-neutral index names

Target shape:

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

### 7.4 Other Schema Comments

Fields such as:

- `changed_by`
- `recorded_by`
- `created_by`
- `actor_id`

may continue storing string user ids, but comments and docs must stop calling them `clerkUserId`.

---

## 8. Better Auth Integration Design

### 8.1 Required Packages

- `better-auth`
- `@better-auth/drizzle-adapter`
- any Better Auth CLI or helper dependency required by the official setup flow

### 8.2 Server Integration

Create an auth module using:

- Better Auth core
- Drizzle adapter
- `tanstackStartCookies()` plugin for TanStack Start

Recommended location:

- `src/lib/auth.ts` or
- `src/server/auth/index.ts`

### 8.3 Route Mount

Mount Better Auth handlers under:

- `/api/auth/*`

Recommended file:

- `src/routes/api/auth/$.ts`

### 8.4 Session Helpers

Create thin helpers so the rest of the app depends on EDARA auth abstractions, not raw provider APIs.

Recommended helper set:

- `getSession()`
- `requireSession()`
- `getUserAssignments(userId)`
- `getPrimaryAssignment(userId)` or equivalent selection rule
- `getCurrentAssignment()`
- `requireAssignment()`

These helpers should:

1. read the Better Auth session from headers/cookies
2. resolve EDARA assignment records from `user_school_assignments`
3. return a normalized auth context

### 8.5 Session Cookie Baseline

MVP session configuration must be explicit rather than left implied.

Minimum baseline:

- use HTTP-only cookies
- use `secure: true` in production
- use a `sameSite` policy appropriate for same-origin app navigation
- ensure local development configuration still works without weakening production defaults

These settings must be defined in Better Auth configuration and then verified through the browser flow during implementation.

### 8.6 App-Level Integration Boundary

Keep a clean separation between:

- raw Better Auth configuration and handler code
- EDARA app-level auth helpers used by oRPC, route guards, and activity logging

The app should not scatter provider-specific session reads across unrelated modules.

---

## 9. Authorization and RLS Design

### 9.1 Source of Truth

Authorization must come from `user_school_assignments`, not from Better Auth organization roles or metadata.

### 9.2 Normalized Auth Context

Recommended shape:

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

This is the shared contract for:

- auth helper return values
- oRPC context
- protected route guard decisions
- activity log actor resolution
- request-scoped RLS setup

### 9.3 Assignment Selection Rule

Assignment resolution must be explicit and deterministic.

Phase 1 rule:

1. query active assignments for the authenticated user
2. if there are no active assignments, return an authenticated-but-unassigned state
3. if there is exactly one active assignment, use it
4. if there are multiple active assignments, use a deterministic primary-selection rule

Recommended primary-selection rule for MVP:

- prefer an assignment explicitly marked primary if that field exists later
- otherwise fall back to the earliest active assignment by `assigned_at`
- if timestamps tie, fall back to stable ordering by assignment id

Important constraints:

- the selected assignment determines `schoolId`, `unitId`, `role`, and `assignmentId` in `AuthContext`
- the same rule must be used consistently across route guards, oRPC context creation, and RLS setup
- multi-school users are allowed by data model, but Phase 1 does not need a rich assignment-switching UX

### 9.4 Current Assignment and Switching

Phase 1 behavior:

- the app may derive the current assignment on each request from the deterministic selection rule
- assignment switching is optional and can be deferred
- if switching is added later, the selected assignment must be stored in a controlled app-level mechanism and validated against active EDARA assignments on every request

Until switching exists, do not invent inconsistent client-only assignment state.

### 9.5 RLS Requirement

RLS context must continue to be set by EDARA within request scope or transaction scope.

Do not:

- rely on global process state
- rely only on frontend route guards
- rely only on Better Auth session existence

### 9.6 Important Correction

Do not implement ad hoc `SET app.current_*` calls in an uncontrolled way. The request-scoped database config must be applied through the same controlled DB access layer used by the app's procedures, consistent with the existing ADR direction.

### 9.7 Single Server-Side Context Builder

Implement one server-side auth/context builder that:

1. reads the Better Auth session from headers/cookies
2. normalizes the authenticated user identity
3. resolves the active EDARA assignment
4. builds the shared `AuthContext`
5. applies request-scoped RLS config through the app's DB layer

Both queries and mutations must run through the same context path so they honor identical tenant state.

---

## 10. UI and UX Design

### 10.1 Auth Routes

Replace Clerk example pages with custom pages:

- `/auth/sign-in`
- `/auth/sign-up`

Recommended route group:

- `src/routes/auth/*`

### 10.2 Form Stack

Use:

- `react-hook-form`
- `zod`
- existing shadcn/ui components

### 10.3 MVP Behavior

Sign-up:

- creates identity in Better Auth
- does not auto-assign school, unit, or role
- places user into a safe onboarding state

Sign-in:

- if user has at least one active EDARA assignment, continue into the app
- if user has no active assignment, show an "awaiting access" state

### 10.4 User Management

EDARA should provide an app-managed access administration flow for:

- listing users known to the app
- linking Better Auth identity to assignment records
- assigning school
- assigning unit
- assigning role
- activating/deactivating assignments

This is distinct from generic identity administration. Better Auth owns identity records; EDARA owns app access.

---

## 11. Migration Strategy

Because there are no live production users, this is a **replacement rollout**, not a dual-provider migration.

### 11.1 Changes That Happen in This Migration

- remove Clerk packages
- remove Clerk example routes
- remove `/clerk/*` route entries from generated routing artifacts by regenerating the route tree
- remove Clerk references from build configuration such as vendor chunk grouping
- add Better Auth packages
- mount Better Auth handler
- rename schema identifiers to provider-neutral names
- update Drizzle snapshots and generated migration history for provider-neutral naming
- clean Clerk-era comments that still describe actor ids or user ids as Clerk-specific
- replace mock auth flow with real session-based auth

### 11.2 Work That Can Be Deferred

- OAuth
- email verification
- forgot password
- 2FA
- full UX polish for admin user management
- wide historical doc cleanup beyond core project docs

---

## 12. Risks and Mitigations

| Risk                                                     | Impact | Mitigation                                                             |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Mixing Better Auth org concepts with EDARA tenancy       | High   | Do not use organization plugin as tenancy source of truth in Phase 1   |
| Provider-specific naming remains in schema/comments/docs | Medium | Rename schema fields now and clean up comments/docs as part of rollout |
| Mock auth and real session state diverge                 | High   | Replace mock auth entry points with a single session-aware auth layer  |
| RLS context set inconsistently                           | High   | Centralize session -> assignment -> DB context resolution              |
| Scope creep into Phase 2 auth features                   | Medium | Keep MVP limited to email/password plus assignment-gated access        |

---

## 13. Execution Principles

1. Treat this as a provider replacement, not a live user migration.
2. Keep Better Auth limited to identity and session.
3. Keep EDARA tables as the source of truth for school, unit, and role access.
4. Preserve ADR constraints around client-only data fetching, RLS, and activity logging.
5. Prefer thin, centralized auth helpers over auth logic scattered across routes and routers.

---

## 14. Implementation Plan

### Phase 1: Preparation and Design Lock

**Goals**

- finalize the auth model
- define rollout order
- avoid mixing tenancy redesign into auth replacement

**Tasks**

| Step | Task                                           | Output                      |
| ---- | ---------------------------------------------- | --------------------------- |
| 1.1  | Confirm Better Auth is identity/session only   | Design baseline locked      |
| 1.2  | Identify all Clerk references in code and docs | Replacement inventory       |
| 1.3  | Identify all mock auth entry points            | Mock-to-real migration list |
| 1.4  | Define normalized auth context shape           | Shared server auth contract |

**Exit Criteria**

- provider model is agreed
- Clerk touchpoints are enumerated
- implementation order is fixed

### Phase 2: Dependency and Schema Foundation

**Goals**

- remove Clerk packages
- install Better Auth packages
- neutralize provider-specific schema naming

**Tasks**

| Step | Task                                                  | Files                                                       |
| ---- | ----------------------------------------------------- | ----------------------------------------------------------- |
| 2.1  | Remove `@clerk/backend` and `@clerk/clerk-react`      | `package.json`                                              |
| 2.2  | Add `better-auth` and `@better-auth/drizzle-adapter`  | `package.json`                                              |
| 2.3  | Add any required Better Auth CLI/dev support          | `package.json` if needed                                    |
| 2.4  | Rename `clerkUserId` -> `userId` in assignment schema | `src/server/db/schema/users.ts`                             |
| 2.5  | Update index names/comments tied to Clerk             | `src/server/db/schema/users.ts` and related schema comments |
| 2.6  | Update build config references to Clerk               | `vite.config.ts`                                            |
| 2.7  | Update Drizzle snapshots for provider-neutral naming  | `drizzle/meta/*`                                            |
| 2.8  | Generate migration for schema rename plus auth tables | `drizzle/*`                                                 |

**Notes**

- do not use direct DB pushes as the primary tracked production path
- keep migration history explicit and reviewable

**Exit Criteria**

- dependencies install cleanly
- schema compiles
- migration files are generated and reviewable

### Phase 3: Better Auth Server Integration

**Goals**

- mount Better Auth in TanStack Start
- make session retrieval available to server-side code

**Tasks**

| Step | Task                                    | Files                                              |
| ---- | --------------------------------------- | -------------------------------------------------- |
| 3.1  | Create auth config with Drizzle adapter | `src/lib/auth.ts` or `src/server/auth/index.ts`    |
| 3.2  | Add TanStack Start cookies plugin       | auth config file                                   |
| 3.3  | Mount auth handler at `/api/auth/$`     | `src/routes/api/auth/$.ts`                         |
| 3.4  | Create session helper functions         | `src/server/auth/*` or `src/lib/auth.functions.ts` |
| 3.5  | Add typed auth context contract         | shared auth types file                             |
| 3.6  | Configure cookie behavior explicitly    | auth config file                                   |

**Exit Criteria**

- Better Auth endpoints respond
- server code can resolve the current session reliably

### Phase 4: Authorization and RLS Bridge

**Goals**

- join Better Auth identity to EDARA access control
- centralize tenant context resolution

**Tasks**

| Step | Task                                                              | Files                           |
| ---- | ----------------------------------------------------------------- | ------------------------------- |
| 4.1  | Build auth middleware that validates session                      | `src/server/middleware/auth.ts` |
| 4.2  | Build assignment resolution helper from `user_school_assignments` | auth/middleware layer           |
| 4.3  | Build role-check helper based on EDARA roles                      | auth/middleware layer           |
| 4.4  | Build request-scoped RLS context setter                           | DB/auth integration layer       |
| 4.5  | Ensure oRPC procedures consume unified auth context               | router base/procedure files     |
| 4.6  | Use one server-side context builder for queries and mutations     | router + DB access layer        |

**Design Rule**

Do not infer authorization from Better Auth metadata if EDARA assignment data exists. The assignment table wins.

**Exit Criteria**

- protected procedures reject unauthenticated users
- protected procedures reject unassigned users
- DB access runs under correct school/unit context

### Phase 5: Frontend Auth Flow Replacement

**Goals**

- replace Clerk example routes
- replace mock sign-in behavior with Better Auth-backed behavior

**Tasks**

| Step | Task                                                                    | Files                                                     |
| ---- | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| 5.1  | Create `/auth` route group                                              | `src/routes/auth/*`                                       |
| 5.2  | Build sign-in page with `react-hook-form` + `zod`                       | `src/routes/auth/(auth)/sign-in.tsx`                      |
| 5.3  | Build sign-up page with `react-hook-form` + `zod`                       | `src/routes/auth/(auth)/sign-up.tsx`                      |
| 5.4  | Add unauthenticated layout if needed                                    | `src/routes/auth/(auth)/route.tsx`                        |
| 5.5  | Add protected route guard behavior                                      | auth route/layout files                                   |
| 5.6  | Replace mock auth-store usage in sign-in flow                           | `src/stores/auth-store.ts`, auth features, `src/main.tsx` |
| 5.7  | Add "awaiting access" screen for authenticated users without assignment | auth onboarding route or guarded layout                   |
| 5.8  | Remove `src/routes/clerk/*`                                             | route files                                               |
| 5.9  | Regenerate `src/routeTree.gen.ts`                                       | generated file                                            |
| 5.10 | Update navigation or links that still point to `/clerk/*`              | route/layout/feature files                                |

**Exit Criteria**

- users can sign in and sign up through `/auth/*`
- mock token login is gone
- Clerk routes no longer exist

### Phase 6: User Access Administration

**Goals**

- allow EDARA admins to grant actual access after identity creation

**Tasks**

| Step | Task                                           | Files                    |
| ---- | ---------------------------------------------- | ------------------------ |
| 6.1  | Define user listing source for admin UI        | auth/users router design |
| 6.2  | Build admin query for users plus assignments   | `src/server/routers/*`   |
| 6.3  | Build mutation for role/school/unit assignment | `src/server/routers/*`   |
| 6.4  | Build or adapt user management UI              | route/feature files      |
| 6.5  | Support activate/deactivate assignment         | router + UI              |

**Clarification**

This phase manages EDARA access records, not password reset, profile editing, or generic identity administration.

**Exit Criteria**

- admin can assign school, unit, and role
- assignment changes affect access correctly

### Phase 7: Documentation Alignment

**Goals**

- remove Clerk as the documented source of truth
- align core project docs with the new auth architecture

**Tasks**

| Step | Task                                         | Files                                  |
| ---- | -------------------------------------------- | -------------------------------------- |
| 7.1  | Update setup and env docs                    | `README.md`, `.env.example`            |
| 7.2  | Update architecture rules referencing Clerk  | `.agents/rules/system-instructions.md` |
| 7.3  | Update technical specification auth sections | `src/docs/technical-specification.md`  |
| 7.4  | Update reconciliation plan auth steps        | `src/docs/reconciliation-plan.md`      |
| 7.5  | Log implementation outcomes                  | `src/docs/reconciliation-log.md`       |

**Priority**

Update `.agents/rules/system-instructions.md` before or alongside the first code implementation slice so future work does not keep inheriting Clerk as the assumed provider.

**Exit Criteria**

- no core project doc still incorrectly instructs future work to integrate Clerk

### Phase 8: Verification

**Required Checks**

1. `pnpm format:check`
2. `pnpm typecheck`
3. `pnpm lint --max-warnings 10`
4. `pnpm build`

**Functional Verification**

- sign up creates Better Auth user
- sign in sets session cookie
- refresh preserves session
- unauthenticated access redirects to sign-in
- authenticated but unassigned user is blocked from tenant data
- assigned user gets correct access
- role checks enforce EDARA roles
- queries and mutations both honor the same request-scoped tenant context
- `/clerk/*` routes are removed from generated routing and navigation

**Suggested Test Coverage**

- unit tests for auth helpers and role guards
- integration tests for session plus assignment resolution
- route-level tests for protected navigation
- explicit coverage for authenticated-but-unassigned users

Minimum explicit scenario:

1. valid Better Auth session exists
2. no active `user_school_assignments` exist for that user
3. user lands on the awaiting-access state
4. tenant-scoped procedures and queries reject access

---

## 15. Sequencing Recommendation

Recommended implementation order:

1. dependencies and schema
2. Better Auth server mount
3. session and assignment helpers
4. route/UI replacement
5. admin assignment flow
6. docs cleanup
7. verification

This order reduces rework because middleware and UI can be built against the normalized auth context instead of raw provider APIs.

---

## 16. Acceptance Criteria

- [ ] Users can sign up with email and password through Better Auth
- [ ] Users can sign in with email and password through Better Auth
- [ ] Session persists across refresh via secure cookies
- [ ] Unauthenticated users are redirected to `/auth/sign-in`
- [ ] Authenticated users without assignments do not gain tenant access
- [ ] Authenticated users with assignments receive correct school/unit/role context
- [ ] Multiple active assignments resolve through one deterministic selection rule
- [ ] `user_school_assignments` no longer uses Clerk-specific identifier naming
- [ ] Clerk example routes and dependencies are removed
- [ ] Clerk references are removed from route tree, build config, and core comments/docs
- [ ] App auth middleware resolves Better Auth session plus EDARA assignment together
- [ ] RLS context continues to be set from EDARA assignment data

---

## 17. Definition of Done

- Better Auth is the only auth provider dependency in the app
- Clerk example code is removed
- EDARA assignment schema uses provider-neutral naming
- auth flow is session-based, not mock-token based
- authorization is resolved from `user_school_assignments`
- RLS context remains compatible with EDARA's tenancy model
- core docs no longer instruct future work to integrate Clerk

---

## 18. Follow-Up Documentation

During implementation or immediately after the auth foundation lands, align:

- `README.md`
- `.agents/rules/system-instructions.md`
- `src/docs/technical-specification.md`
- `src/docs/reconciliation-plan.md`
- `src/docs/reconciliation-log.md`

---

## 19. External References

- [Better Auth from Clerk Migration Guide](https://better-auth.com/docs/guides/clerk-migration-guide)
- [Better Auth TanStack Start Integration](https://better-auth.com/docs/integrations/tanstack)
- [Better Auth Drizzle Adapter](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Better Auth LLMs.txt](https://better-auth.com/llms.txt)
---

**End of Canonical Spec**
