# Project Memory — EDARA

> Layer 2: Feature inventory, known gotchas, active constraints, and current state.
> Updated as features are implemented or blockers are discovered.

---

## Current Status

- **Phase:** Phase 1 — Migration from Mock to Real Backend
- **Progress:** Sections 1–8 are complete through Step 22, and Section 9 Steps 23–25 are complete. Live today: auth runtime, tenant/school-unit flows, academic years, dashboard, activity logs, full Teacher Management including bulk import/export, Class Management end-to-end with grouped class listing, class detail/student roster, create, update, and transactional mass promotion wired through the live frontend, and Student API Router with all 6 procedures (`list`, `create`, `update`, `getById`, `changeStatus`, `getStatusHistory`) implemented, registered in app-router, and passing build. The remaining domain areas are still being migrated from mock data.
- **Active Branch:** Do not rely on this file for branch state; verify with `git status` / `git log`.
- **Implementation Plan:** Section 9 Step 25 is complete. Next milestone is Section 9 Step 26 — Student Frontend (list, registration, hooks).

## Working Mental Model

- EDARA is a **SPA-first application with an embedded TanStack Start server runtime**, not a backendless static app.
- The frontend shell is client-rendered and avoids SSR/page `loader` patterns.
- The backend boundary already exists in-repo via `src/server.ts`, `src/routes/api/auth/$`, `src/routes/api/rpc/$`, Better Auth, oRPC routers, and Drizzle/Neon access.
- Migration status is mixed by domain: some areas are fully live on the real backend, while unfinished domains still rely on mock/local-state frontends until their implementation-plan steps are completed.

## Feature Inventory

| # | Feature | Spec IDs | Status | Notes |
|---|---------|----------|--------|-------|
| 1 | Multi-Tenant Management | MT-01–05 | Schema ✅, API ✅, UI ✅ | School + unit flows are wired through live tenant routers and authenticated unit context |
| 2 | Auth & RBAC | AUTH-01–05 | Schema ✅, Runtime ✅ | Better Auth session flow, route protection, and EDARA RBAC/unit-context middleware are live |
| 3 | Academic Year | AY-01–04 | Schema ✅, API ✅, UI ✅ | Timeline, form modal, activation flow wired to live API |
| 4 | Dashboard | DASH-01–05 | Schema ✅, API ✅, UI ✅ | Summary cards, cashflow chart, upcoming events, and recent activity use live API data |
| 5 | Teachers | TCH-01–05 | Schema ✅, API ✅, UI ✅ | Step 20 complete: tenant-scoped teacher router (`list`, `getById`, `create`, `update`, `deactivate`) + validators live. Step 21 complete: teacher list, detail, create, update, and deactivate use the live API. Step 22 complete: bulk import preview/partial import and filtered Excel export are live through `tenant.teachers.previewImport`, `tenant.teachers.executeImport`, and `tenant.teachers.export` |
| 6 | Classes | CLS-01–03 | Schema ✅, API ✅, UI ✅ | Step 24 complete: `src/features/classes/` now uses live `tenant.classes.list`, `getById`, `create`, `update`, and `massPromotion`, derives active/next academic year context from `tenant.academicYears.list`, uses `tenant.teachers.list` for homeroom options, groups cards by grade, and removes the old mock/delete flows |
| 7 | Students | STU-01–06 | Schema ✅, API ✅, UI mock | Step 25 complete: `studentsRouter` with `list` (paginated, server-side search/filter), `create` (dual insert: students + enrollments), `update`, `getById` (with enrollment history + payment history), `changeStatus` (writes to enrollment_status_history), `getStatusHistory`. NISN uniqueness enforced per school. No permanent delete. Registration Drawer, Detail Page with tabs, Status Transitions remain mock. |
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

1. **Repo memory can drift faster than code** — Always cross-check `docs/implementation-plan.md`, `.agents/memory/log.md`, and `src/server/routers/app-router.ts` before assuming feature status.
2. **Backend coverage is partial, not absent** — Live routers exist for auth-adjacent tenant flows, academic years, dashboard, activity logs, teachers, and classes; students/SPP/cashflow/events remain pending.
3. **Frontend is mixed live + mock** — `academic-years`, `dashboard`, settings/unit flows, full Teacher Management, and full Class Management are live, while students/SPP/cashflow/events/users still contain mock data or placeholder flows.
4. **Teacher import/export is intentionally deferred** — Step 21 leaves teacher import/export as disabled placeholders so the UI does not imply a live bulk flow that does not exist yet.
5. **Local build still needs env for prerender** — `pnpm build` compiles the app, but local prerender will fail without `DATABASE_URL` (and related runtime env) because the workspace cannot open Neon during prerender.
6. **Large chunk warning** — 581KB bundle remains a future optimization target.

## Active Constraints

- **No SSR** — Phase 1 is pure SPA
- **Mixed live/mock migration** — New work must preserve already-live flows while replacing remaining mock-backed feature modules incrementally
- **Windows-only dev** — PowerShell required, UNIX commands unreliable
- **pnpm only** — No npm/yarn

## Auth Migration Status (Clerk → Better Auth)

- **Decision:** Better Auth handles identity/session; EDARA handles tenancy/RBAC
- **Client layer:** `auth-client.ts`, `auth.functions.ts`, and auth routing are functional
- **Server layer:** Better Auth runtime and oRPC auth middleware are active; authenticated procedures flow through `context.ts`, auth middleware, and unit-context middleware
- **Route mounts:** Auth and RPC endpoints exist under `src/routes/api/auth/$` and `src/routes/api/rpc/$`
- **Current focus:** Auth foundation is in place for the live sections; remaining migration work should target unfinished domain routers and remaining mock-backed frontend feature rewiring
