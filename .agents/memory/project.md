# Project Memory — EDARA

> Layer 2: Feature inventory, known gotchas, active constraints, and current state.
> Updated as features are implemented or blockers are discovered.

---

## Current Status

- **Phase:** Phase 1 — Migration from Mock to Real Backend
- **Progress:** ~25% MVP (Infrastructure 100%, DB Schema 100%, Auth ~40%, API 0%, Frontend ~40%)
- **Active Branch:** `feat/auth` (PR #9 → `dev`)
- **Implementation Plan:** Section 2 completed, Section 3 in progress (Steps 1–7 done of 27 total)

## Feature Inventory

| # | Feature | Spec IDs | Status | Notes |
|---|---------|----------|--------|-------|
| 1 | Multi-Tenant Management | MT-01–05 | Schema ✅, API ❌, UI partial | Unit Grid, Unit Switcher, Add/Edit Drawer (480px) |
| 2 | Auth & RBAC | AUTH-01–05 | Schema ✅, Better Auth ~40% | Login split layout, RBAC matrix (4 roles), route guards working |
| 3 | Academic Year | AY-01–04 | Schema ✅, API ❌, UI mock | Timeline, Form Modal, Activation Flow |
| 4 | Dashboard | DASH-01–05 | Schema ✅, API ❌, UI mock | 3-row layout: Summary Cards, Chart+Events, Activity Log |
| 5 | Teachers | TCH-01–05 | Schema ✅, API ❌, UI mock | Table, Side Drawer (520px), Bulk Import 4-step flow |
| 6 | Classes | CLS-01–03 | Schema ✅, API ❌, UI mock | Class Grid per grade, Mass Promotion 3-step modal |
| 7 | Students | STU-01–06 | Schema ✅, API ❌, UI mock | Registration Drawer, Detail Page with tabs, Status Transitions |
| 8 | SPP Payment | SPP-01–10 | Schema ✅, API ❌, UI mock | Config, Recording (4-step), Monitoring (payment matrix) |
| 9 | Cashflow | CF-01–04 | Schema ✅, API ❌, UI mock | Summary cards, chart, transaction table, auto-link from SPP |
| 10 | Events/Calendar | EVT-01–04 | Schema ✅, API ❌, UI mock | DataTable tab, Calendar tab with chips, Side Drawer |

## Database Schema (18 Tables)

All tables defined in Drizzle ORM under `src/server/db/schema/`:

| Domain | Tables |
|--------|--------|
| Core | `schools`, `school_units` |
| Academic | `academic_years` |
| Personnel | `teachers` |
| Students | `students` |
| Classes | `classes` |
| Enrollments | `enrollments`, `enrollment_status_history` |
| SPP | `payment_categories`, `class_payment_rates`, `discount_schemes`, `payment_bills`, `payment_transactions` |
| Cashflow | `cashflow_categories`, `cashflow_transactions` |
| Events | `school_events` |
| Users | `user_school_assignments` |
| Logs | `activity_logs` |
| Auth (Better Auth) | `user`, `session`, `account`, `verification` |

## Known Gotchas

1. **No oRPC routers exist yet** — All frontend data is mock/hardcoded
2. **All frontend uses mock data** — No real API calls implemented
3. **No DB migrations pushed** — Schema defined but not applied to any database
4. **Better Auth server is dead code** — `betterAuth()` instance exists but no server runtime executes it
5. **`src/lib/auth.ts` path issue** — Should be in `src/server/` to prevent client-side import leaks
6. **`userSchoolAssignments.userId` missing FK** — No foreign key to `user.id`, orphaned assignments possible
7. **Auth schema missing `hashedPassword`** — Not explicitly declared in schema
8. **Admin router has no role check** — All authenticated users can list/assign
9. **`@tanstack/react-start` installed but unused** — devDependency, consider removing
10. **Drizzle migration drift** — Snapshot says `user_id` but SQL `0000` still has `clerk_user_id`
11. **Large chunk warning** — 581KB bundle, future optimization target

## Active Constraints

- **No SSR** — Phase 1 is pure SPA
- **No database push** — Migrations generated but not applied
- **Better Auth ~40%** — Client layer works, server runtime not yet functional
- **Windows-only dev** — PowerShell required, UNIX commands unreliable
- **pnpm only** — No npm/yarn

## Auth Migration Status (Clerk → Better Auth)

- **Decision:** Better Auth handles identity/session; EDARA handles tenancy/RBAC
- **Schema rename:** `clerkUserId` → `userId` (completed in TypeScript, drift in SQL migrations)
- **Client layer:** `auth-client.ts`, `auth.functions.ts`, `auth-routing.ts` — functional
- **Server layer:** oRPC middleware scaffolding (`context.ts` → `auth.ts` → `authorized.ts`) — correct pattern, not yet runtime
- **Route mount:** `/api/auth/$` — removed (caused server deps leak to client bundle)
- **Next steps:** Scaffold backend auth server, regenerate Drizzle migrations, seed test user
