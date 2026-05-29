# Implementation Plan — EDARA

> Canonical step-by-step implementation plan for EDARA Phase 1: Migration from Mock to Real Backend.
> Re-evaluated against PRD, ADRs, Memory, Rules, and Feature Stories on 2026-04-28.
>
> **Format:** Each step is self-contained — the app MUST build (`pnpm build`) after every step.
> **Notation:** `(exists)` = file already exists and will be modified; no marker = new file.

---

## Progress Overview

| Section | Steps | Status |
|---------|-------|--------|
| 1. Stabilization & Infrastructure | 1–3 | ✅ Done |
| 2. Database Schema & RLS | 4–7 | ✅ Done |
| 2.5. TanStack Start SPA Migration | 0 | ✅ Done |
| 3. Auth Backend & Middleware | 8–11 | ✅ Done |
| 4. oRPC Foundation & Root Router | 12–13 | ✅ Done |
| 5. Tenant & Org Structure | 14–15 | ✅ Done |
| 6. Academic Year Management | 16–17 | ✅ Done |
| 7. Dashboard & Activity Log | 18–19 | ✅ Done |
| 8. Teacher Management | 20–22 | ✅ Done |
| 9. Class & Student Management | 23–27 | 🟡 In Progress |
| 10. SPP Payment System | 28–34 | ❌ Not Started |
| 11. Cashflow, Events & Export | 35–40 | ❌ Not Started |

**Total: 12 sections, 41 steps (Step 0 + Steps 1–40).**

---

## Section 1 — Stabilization & Infrastructure ✅

### Step 1: Fix Build & Lint Errors ✅

- **Task:** Resolve all TypeScript, ESLint, and Vite build errors so `pnpm build` passes cleanly.
- **Files:** Various (build-blocking files)
- **Step Dependencies:** None
- **User Instructions:** Run `pnpm build && pnpm lint` — must pass with zero errors.
- **Rollback:** `git stash` or revert commit.

### Step 2: Configure Path Aliases & Project Structure ✅

- **Task:** Ensure `tsconfig.json` path aliases (`@/`, `@server/`) resolve correctly for both Vite and TypeScript.
- **Files:** `tsconfig.json (exists)`, `vite.config.ts (exists)`
- **Step Dependencies:** Step 1
- **User Instructions:** Run `pnpm typecheck` — must pass.
- **Rollback:** Revert `tsconfig.json` and `vite.config.ts` changes.

### Step 3: Stabilize Dev Server & Bundle ✅

- **Task:** Fix Vite dev server warnings, configure rollup override (4.60.0), address 581KB chunk warning with manual chunks.
- **Files:** `vite.config.ts (exists)`, `package.json (exists)`
- **Step Dependencies:** Step 2
- **User Instructions:** Run `pnpm dev` — no warnings except expected Vite deprecations.
- **Rollback:** Revert `vite.config.ts` changes.

---

## Section 2 — Database Schema & RLS ✅

### Step 4: Core & Auth Schema ✅

- **Task:** Define Drizzle schemas for `schools`, `school_units`, and Better Auth tables (`user`, `session`, `account`, `verification`).
- **Files:** `src/server/db/schema/schools.ts (exists)`, `src/server/db/schema/auth.ts (exists)`, `src/server/db/schema/index.ts (exists)`
- **Step Dependencies:** Step 3
- **User Instructions:** Run `pnpm typecheck`.
- **Rollback:** Revert schema files.

### Step 5: Operational Schema ✅

- **Task:** Define all operational table schemas: `academic_years`, `teachers`, `students`, `classes`, `enrollments`, `enrollment_status_history`, SPP tables, cashflow tables, `school_events`, `user_school_assignments`, `activity_logs`.
- **Files:** `src/server/db/schema/academic-years.ts (exists)`, `src/server/db/schema/teachers.ts (exists)`, `src/server/db/schema/students.ts (exists)`, `src/server/db/schema/classes.ts (exists)`, `src/server/db/schema/enrollments.ts (exists)`, `src/server/db/schema/spp.ts (exists)`, `src/server/db/schema/cashflow.ts (exists)`, `src/server/db/schema/events.ts (exists)`, `src/server/db/schema/users.ts (exists)`, `src/server/db/schema/logs.ts (exists)`
- **Step Dependencies:** Step 4
- **User Instructions:** Run `pnpm typecheck`.
- **Rollback:** Revert schema files.

### Step 6: Generate Drizzle Migrations ✅

- **Task:** Run `drizzle-kit generate` to produce SQL migration files from schema definitions.
- **Files:** `drizzle/0000_init_tenant_operational_schema.sql`, `drizzle/0001_rls_and_constraints.sql`, `drizzle/0002_next_power_pack.sql`
- **Step Dependencies:** Step 5
- **User Instructions:** Run `pnpm db:generate` — inspect output SQL.
- **Rollback:** Delete generated migration files.

### Step 7: RLS Policies & Constraints ✅

- **Task:** Add PostgreSQL RLS policies for tenant isolation (`school_id = current_setting('app.current_school')::uuid`) and unit isolation. Add partial unique index on `academic_years (unit_id) WHERE is_active = TRUE`. Add unique index on `students (school_id, nisn)`.
- **Files:** `drizzle/0001_rls_and_constraints.sql (exists)`
- **Step Dependencies:** Step 6
- **User Instructions:** Review SQL migration for correctness.
- **Rollback:** Revert migration file.

---

## Section 2.5 — TanStack Start SPA Migration (Prerequisite) ✅

> **Refs:** PRD §1.2 ("Full-stack Framework: TanStack Start"), PRD §2.2 (data flow), ADR-01 ("SPA Phase 1, SSR Phase 2")
>
> **Why this step exists:** The current codebase is a plain Vite SPA using `@tanstack/router-plugin/vite` for file-based routing. However, Steps 9 and 12 require **server-side API routes** (`src/routes/api/auth/$.ts`, `src/routes/api/rpc/$.ts`) which only work with TanStack Start's server runtime (Nitro). Without this migration, Better Auth and oRPC have no HTTP handler — they are dead code. TanStack Start's SPA mode gives us the server runtime for API routes while keeping the client-side SPA behavior unchanged (no SSR).

### Step 0: Migrate Vite SPA → TanStack Start SPA Mode ✅

- **Task:** Convert the build pipeline from plain Vite + TanStack Router plugin to TanStack Start SPA mode with Nitro server runtime. This enables file-based API routes (`src/routes/api/**`) while keeping the app as a client-rendered SPA (no SSR). The migration touches the build config, entry points, and root route — all existing page routes remain unchanged.
- **Sub-tasks:**
  1. **Package changes:** Move `@tanstack/react-start` from `devDependencies` → `dependencies`. Add `nitro` package. Optionally replace `@vitejs/plugin-react-swc` with `@vitejs/plugin-react` (official docs only show non-SWC; SWC may work but is untested with Start). Remove `@tanstack/router-plugin` (superseded by `tanstackStart()` which includes router generation).
  2. **`vite.config.ts`:** Replace `tanstackRouter()` from `@tanstack/router-plugin/vite` with `tanstackStart({ spa: { enabled: true } })` from `@tanstack/react-start/plugin/vite`. Add `nitro()` from `nitro/vite`. Keep `tailwindcss()`, compression, and visualizer plugins. Use `resolve: { tsconfigPaths: true }` instead of manual `path.resolve` alias (optional but recommended). Plugin order: `tanstackStart()` → `viteReact()` → `tailwindcss()` → others.
  3. **`src/router.tsx` (new):** Extract router creation from `main.tsx` into a `getRouter()` factory function. Move `QueryClient` creation and router context here. Export `getRouter` (TanStack Start requires a factory, not a singleton). Keep `createRouter({ routeTree, context: { queryClient }, ... })` config.
  4. **`src/server.ts` (new):** Create minimal server entry point using `createServerEntry` from `@tanstack/react-start/server-entry`.
  5. **`src/routes/__root.tsx`:** Add full HTML document structure (`<html>`, `<head>`, `<body>`). Import and render `<HeadContent />` in `<head>` and `<Scripts />` at end of `<body>`. Move meta tags from `index.html` into `head()` return value (charset, viewport, title, OG tags, favicon links, font preloads). Keep `createRootRouteWithContext<{ queryClient: QueryClient }>()` — this works with TanStack Start. Keep existing `Outlet`, `Toaster`, devtools, `NavigationProgress`, error/notFound components. Wrap everything in `RootDocument` component pattern.
  6. **`src/main.tsx` → delete or gut:** TanStack Start manages entry points automatically. The `ReactDOM.createRoot` + `RouterProvider` pattern is replaced by Start's internal hydration. If keeping the file, it should only re-export from router.tsx. The `QueryClientProvider`, `ThemeProvider`, `FontProvider`, `DirectionProvider` wrappers move into `__root.tsx`'s `RootDocument` component.
  7. **`index.html` → delete:** TanStack Start generates the HTML document from `__root.tsx`'s `head()` + `RootDocument`. The static `index.html` is no longer used.
  8. **`package.json` scripts:** Update `"build"` script — `tsc -b && vite build` may need adjustment for Nitro build output. `"dev": "vite"` should still work. Verify `"preview"` still works.
  9. **`tsconfig.app.json`:** Ensure `include` covers server files (`src/server.ts`, `src/router.tsx`). These should already be under `src/`.
- **Files (7):**
  - `vite.config.ts (exists)` ← rewrite: tanstackStart + nitro + viteReact
  - `src/router.tsx` ← new: getRouter() factory with QueryClient context
  - `src/server.ts` ← new: createServerEntry
  - `src/routes/__root.tsx (exists)` ← rewrite: full HTML document + head() + providers
  - `src/main.tsx (exists)` ← delete or reduce to re-export
  - `index.html (exists)` ← delete (replaced by __root.tsx)
  - `package.json (exists)` ← move @tanstack/react-start to deps, add nitro, update scripts
- **Step Dependencies:** Step 3 (stable build)
- **User Instructions:**
  1. Run `pnpm install` after package.json changes
  2. Run `pnpm dev` — app should start and render identically to before (SPA mode = same client behavior)
  3. Verify all existing routes still work (navigate through the app)
  4. Verify `http://localhost:3000/api/auth/ok` returns 404 (no auth handler yet — but the route system is ready)
  5. Run `pnpm build` — must pass (output will now include Nitro server bundle)
- **Rollback:** `git checkout -- vite.config.ts src/routes/__root.tsx src/main.tsx index.html package.json && git clean -fd src/router.tsx src/server.ts && pnpm install`
- **Risk Notes:**
  - The `rollup` override (`4.60.0`) in package.json may conflict with Nitro's bundler — test and remove if needed.
  - `vite-plugin-compression` and `rollup-plugin-visualizer` should still work but verify.
  - `manualChunks` config in `build.rollupOptions` may need adjustment for Nitro's output format.
  - If `@vitejs/plugin-react-swc` works with Start, keep it for faster builds — but switch to `@vitejs/plugin-react` if any issues arise.

---

## Section 3 — Auth Backend & Middleware ✅

> **Refs:** AUTH-01–05, C7, C9, ADR-01, Better Auth Migration Spec (all 8 phases)

### Step 8: Better Auth Server Setup ✅

- **Task:** Complete Better Auth server configuration. Move `src/lib/auth.ts` → `src/server/auth/index.ts`. Configure email/password provider, session cookie settings (HTTP-only, secure in production, 8hr expiry per AUTH-01), Drizzle adapter. Fix `userSchoolAssignments.userId` to add FK reference to `user.id`. Verify auth schema includes all fields Better Auth needs (password hash is stored in `account` table by Better Auth internally). Fix Drizzle migration drift (`clerk_user_id` → `user_id` in SQL).
- **Files (10):**
  - `src/server/auth/index.ts` ← new (moved from `src/lib/auth.ts`)
  - `src/lib/auth.ts (exists)` ← delete or re-export from server
  - `src/lib/auth-client.ts (exists)` ← update import path
  - `src/server/db/schema/auth.ts (exists)` ← verify fields
  - `src/server/db/schema/users.ts (exists)` ← add FK on userId → user.id
  - `src/server/db/schema/index.ts (exists)` ← update exports
  - `drizzle/0000_init_tenant_operational_schema.sql (exists)` ← fix clerk_user_id → user_id
  - `src/lib/auth.functions.ts (exists)` ← update import path
  - `src/stores/auth-store.ts (exists)` ← keep for now, will replace in Step 10
  - `src/lib/constants.ts (exists)` ← fix role names: admin→super_admin, tata_usaha→admin_tu
- **Step Dependencies:** Step 0 (TanStack Start SPA migration — required for API routes in Step 9), Step 7
- **User Instructions:**
  1. Ensure `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` are set in `.env`
  2. Run `pnpm db:generate` to regenerate migrations with FK fix
  3. Run `pnpm build` — must pass
- **Rollback:** `git checkout -- src/server/auth/ src/lib/auth.ts src/server/db/schema/users.ts`

### Step 9: Auth API Route Handler ✅

- **Task:** Create the Better Auth HTTP handler route. Since ADR-01 forbids SSR/`createServerFn`, mount Better Auth as an API route that the SPA can call. Create `src/routes/api/auth/$.ts` as a catch-all route that delegates to `auth.handler` using TanStack Start's `createFileRoute` with `server.handlers` (enabled by Step 0's Nitro migration). This is the runtime entry point that makes Better Auth functional (currently dead code).
- **Files (3):**
  - `src/routes/api/auth/$.ts` ← new (Better Auth catch-all handler using `createFileRoute` + `server.handlers`)
  - `src/server/auth/index.ts (exists)` ← ensure handler export
  - `src/lib/auth-client.ts (exists)` ← verify baseURL points to `/api/auth`
- **Step Dependencies:** Step 0 (provides Nitro server runtime for API routes), Step 8
- **User Instructions:**
  1. Run `pnpm dev`
  2. Test: `curl http://localhost:3000/api/auth/ok` should return Better Auth health check
  3. Run `pnpm build` — must pass
- **Rollback:** Delete `src/routes/api/auth/$.ts`.

### Step 10: oRPC Auth Middleware Stack ✅

- **Task:** Build the complete oRPC middleware chain per the migration spec: `context.ts` → `auth.ts` (session validation) → `requireUnitContext.ts` (resolve assignment + set RLS) → `requireRole.ts` (RBAC check) → `withActivityLog.ts` (centralized logging per ADR-05). Update `authorized.ts` to include full `AuthContext` with EDARA fields (`userId`, `email`, `schoolId`, `unitId`, `role`, `assignmentId`). The `requireUnitContext` middleware must call `resolveAssignment()` and execute `SET LOCAL app.current_school = schoolId; SET LOCAL app.current_unit = unitId` on the database connection for RLS (ADR-02).
- **Files (9):**
  - `src/server/routers/middlewares/auth.ts (exists)` ← enhance: validate session via Better Auth, inject session+user
  - `src/server/routers/middlewares/require-unit-context.ts` ← new: resolve assignment, set RLS session vars
  - `src/server/routers/middlewares/require-role.ts` ← new: check role against allowed roles array
  - `src/server/routers/middlewares/with-activity-log.ts` ← new: post-hook logging to activity_logs (ADR-05)
  - `src/server/routers/middlewares/index.ts` ← new: barrel export
  - `src/server/routers/context.ts (exists)` ← keep as-is (base context)
  - `src/server/routers/authorized.ts (exists)` ← update AuthContext type with EDARA fields
  - `src/server/routers/helpers/assignment.ts (exists)` ← verify, may need db param
  - `src/server/db/index.ts (exists)` ← ensure `SET LOCAL` helper or raw SQL support
- **Step Dependencies:** Step 9
- **User Instructions:** Run `pnpm build` — must pass. Middleware is not yet called by any router (tested in Step 12).
- **Rollback:** `git checkout -- src/server/routers/`

### Step 11: Frontend Auth Flow & Stores ✅

- **Task:** Replace mock auth store with real Better Auth integration. Update `auth-store.ts` to use `authClient.getSession()` for session state. Update `tenant-store.ts` to fetch real assignments from API (will use oRPC after Step 13, for now use authClient). Update `_authenticated/route.tsx` to use real session check. Update login page (`sign-in.tsx`) to call `authClient.signIn.email()`. Remove mock token logic. Fix role constants in `constants.ts` to match DB enum (`super_admin`, `kepala_sekolah`, `admin_tu`, `bendahara`). Update `AuthenticatedLayout` and route guards.
- **Files (12):**
  - `src/stores/auth-store.ts (exists)` ← rewrite: real Better Auth session
  - `src/stores/tenant-store.ts (exists)` ← rewrite: real assignment data
  - `src/routes/_authenticated/route.tsx (exists)` ← update guard to use real session
  - `src/routes/(auth)/sign-in.tsx (exists)` ← wire to authClient.signIn.email()
  - `src/lib/auth-client.ts (exists)` ← ensure correct config
  - `src/lib/auth.functions.ts (exists)` ← update to use authClient (not createServerFn)
  - `src/lib/auth-routing.ts (exists)` ← update route guard logic
  - `src/lib/constants.ts (exists)` ← fix role enum names
  - `src/components/layout/tenant-switcher.tsx (exists)` ← prepare for real data (can still use mock fallback)
  - `src/components/layout/nav-user.tsx (exists)` ← show real user name/email
  - `src/components/layout/authenticated-layout.tsx (exists)` ← update context provider
  - `src/features/auth/components/sign-in-form.tsx (exists)` ← wire to real auth
- **Step Dependencies:** Step 10
- **User Instructions:**
  1. Run `pnpm db:push` to apply migrations to Neon database
  2. Seed a test user: use Better Auth admin API or direct DB insert
  3. Run `pnpm dev` — test login flow end-to-end
  4. Run `pnpm build` — must pass
- **Rollback:** `git stash` — this step touches many files.

---

## Section 4 — oRPC Foundation & Root Router ✅

> **Refs:** PRD §5.1, ADR-01, ADR-02, Coding Standards (middleware stack order)

### Step 12: oRPC Server Setup & Root Router ✅

- **Task:** Create the oRPC server entry point and root `appRouter`. Set up the oRPC HTTP handler as a Vite API route. Create the router registry that composes all domain routers (initially empty, filled in subsequent steps). Export `AppRouter` type for client-side type inference. Create the oRPC client with TanStack Query integration.
- **Files (8):**
  - `src/server/routers/app-router.ts` ← new: root appRouter composing all domain routers
  - `src/server/routers/index.ts` ← new: barrel export for router + type
  - `src/routes/api/rpc/$.ts` ← new: oRPC HTTP handler catch-all route (uses TanStack Start server routes from Step 0)
  - `src/lib/orpc-client.ts` ← new: oRPC client with cookie credentials
  - `src/lib/orpc-react.ts` ← new: TanStack Query integration (createORPCReactQueryUtils)
  - `src/server/routers/admin/users.ts (exists)` ← add role checks (requireRole(['super_admin']))
  - `src/server/routers/authorized.ts (exists)` ← export middleware compositions for routers
  - `src/lib/auth-client.ts (exists)` ← verify no conflict with oRPC client
- **Step Dependencies:** Step 11
- **User Instructions:**
  1. Run `pnpm dev`
  2. Test: `curl http://localhost:3000/api/rpc` should return oRPC discovery or 404 (no procedures yet)
  3. Run `pnpm build` — must pass
- **Rollback:** Delete new files, revert `admin/users.ts`.

### Step 13: Shared Validators & API Utilities ✅

- **Task:** Create shared Zod v4 validation schemas used across multiple routers. Create pagination utilities (`paginationSchema`, `paginatedResponse`), common ID validators, date range validators, search/filter schemas. Create API error helpers. These are consumed by all subsequent domain routers.
- **Files (7):**
  - `src/lib/validators/common.ts` ← new: uuidSchema, paginationSchema, dateRangeSchema, searchSchema
  - `src/lib/validators/auth.ts` ← new: signInSchema, signUpSchema (move from inline)
  - `src/lib/validators/index.ts` ← new: barrel export
  - `src/server/utils/pagination.ts` ← new: buildPaginatedQuery helper
  - `src/server/utils/errors.ts` ← new: typed error creators (NOT_FOUND, FORBIDDEN, etc.)
  - `src/server/utils/index.ts` ← new: barrel export
  - `src/lib/decimal-setup.ts (exists)` ← verify decimal.js config for financial validators
- **Step Dependencies:** Step 12
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files.

---

## Section 5 — Tenant & Org Structure

> **Refs:** MT-01–05, Feature Stories §1 (Foundation Registration, Unit Management, Unit Switcher)

### Step 14: Tenant & Unit API Routers ✅

- **Task:** Create `tenantRouter` with procedures for foundation (school) management and unit CRUD. Procedures: `schools.get` (current school details), `units.list` (all units for school), `units.create`, `units.update`, `units.getById`. Unit create/update validates NPSN format (8 digits). All procedures use `requireUnitContext` middleware (except `schools.get` which only needs auth). Register in `appRouter`.
- **Files (7):**
  - `src/server/routers/tenant/index.ts` ← new: tenantRouter
  - `src/server/routers/tenant/schools.ts` ← new: school procedures
  - `src/server/routers/tenant/units.ts` ← new: unit CRUD procedures
  - `src/lib/validators/tenant.ts` ← new: createUnitSchema, updateUnitSchema (NPSN validation)
  - `src/server/routers/app-router.ts (exists)` ← register tenantRouter
  - `src/server/routers/authorized.ts (exists)` ← ensure middleware exports
  - `src/server/routers/middlewares/require-role.ts (exists)` ← verify role check works
- **Step Dependencies:** Step 13
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 15: Tenant Frontend — Unit Management & Switcher ✅

- **Task:** Wire Unit Management page and Unit Switcher to real API. Replace mock data in `tenant-store.ts` with oRPC calls. Create hooks: `useSchool()`, `useUnits()`, `useCreateUnit()`, `useUpdateUnit()`. Update Unit Grid to use `useUnits()`. Update Unit Switcher dropdown to use real unit list. Update Add/Edit Unit Side Drawer (480px per feature stories) to use `useCreateUnit()`/`useUpdateUnit()` with react-hook-form + Zod. Handle empty state per feature stories. Super admin context banner.
- **Files (12):**
  - `src/features/settings/hooks/use-school.ts` ← new: useQuery for school data
  - `src/features/settings/hooks/use-units.ts` ← new: useQuery for units list
  - `src/features/settings/hooks/use-create-unit.ts` ← new: useMutation
  - `src/features/settings/hooks/use-update-unit.ts` ← new: useMutation
  - `src/features/settings/hooks/index.ts` ← new: barrel export
  - `src/features/settings/components/unit-grid.tsx (exists)` ← wire to useUnits()
  - `src/features/settings/components/unit-card.tsx (exists)` ← wire to real data
  - `src/features/settings/components/unit-form-drawer.tsx (exists)` ← wire to mutations + RHF + Zod
  - `src/stores/tenant-store.ts (exists)` ← rewrite to use oRPC data
  - `src/components/layout/tenant-switcher.tsx (exists)` ← wire to real unit list
  - `src/lib/validators/tenant.ts (exists)` ← reuse for client-side validation
  - `src/components/layout/header.tsx (exists)` ← add super admin context banner
- **Step Dependencies:** Step 14
- **User Instructions:**
  1. Ensure at least one school + unit exists in DB (seed or create via API)
  2. Run `pnpm dev` — test unit CRUD flow
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash` — touches many frontend files.

---

## Section 6 — Academic Year Management

> **Refs:** AY-01–04, Feature Stories §3 (Timeline, Form Modal, Activation Flow), B2 (exclusive activation)

### Step 16: Academic Year API Router ✅

- **Task:** Create `academicYearsRouter` with procedures: `list` (all years for unit, ordered by start_date DESC), `create` (with date overlap validation), `update`, `activate` (transaction: deactivate current → activate new, per AY-03/B2), `getActive` (current active year). Activation must use `db.transaction()` with `tx` inside (coding standard). The partial unique index `(unit_id) WHERE is_active = TRUE` enforces single-active at DB level. Register in `appRouter`.
- **Files (5):**
  - `src/server/routers/academic-years/index.ts` ← new: academicYearsRouter
  - `src/lib/validators/academic-years.ts` ← new: createAcademicYearSchema, updateSchema
  - `src/server/routers/app-router.ts (exists)` ← register academicYearsRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse middleware stack
- **Step Dependencies:** Step 13
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 17: Academic Year Frontend ✅

- **Task:** Wire Academic Year page to real API. Create hooks: `useAcademicYears()`, `useCreateAcademicYear()`, `useActivateAcademicYear()`. Replace mock data with oRPC queries. Implement timeline UI (vertical, newest on top, active year has Forest border-left + "Aktif Saat Ini" label per feature stories). Implement Form Modal (name, date pickers, overlap validation). Implement Activation Flow (confirmation dialog → toast → CTA "Atur Kelas Sekarang →" per feature stories). Handle empty state.
- **Files (10):**
  - `src/features/academic-years/hooks/use-academic-years.ts` ← new: useQuery
  - `src/features/academic-years/hooks/use-create-academic-year.ts` ← new: useMutation
  - `src/features/academic-years/hooks/use-activate-academic-year.ts` ← new: useMutation
  - `src/features/academic-years/hooks/index.ts` ← new: barrel
  - `src/features/academic-years/components/academic-year-timeline.tsx (exists)` ← wire to real data
  - `src/features/academic-years/components/academic-year-form-modal.tsx (exists)` ← wire to mutation + RHF + Zod
  - `src/features/academic-years/components/activation-dialog.tsx (exists)` ← wire to mutation
  - `src/routes/_authenticated/academic-years/index.tsx (exists)` ← wire to hooks
  - `src/lib/validators/academic-years.ts (exists)` ← reuse for client validation
  - `src/features/academic-years/data/ (exists)` ← remove mock data files
- **Step Dependencies:** Step 16
- **User Instructions:**
  1. Create at least one academic year via API or seed
  2. Run `pnpm dev` — test create, activate, timeline display
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

---

## Section 7 — Dashboard & Activity Log

> **Refs:** DASH-01–05, Feature Stories §4 (3-row layout, summary cards with delta, chart, activity log)

### Step 18: Dashboard API Router ✅

- **Task:** Create `dashboardRouter` with procedures: `getSummaryCards` (total active students, total active teachers, SPP income this month — with delta vs previous month), `getCashflowChart` (6-month grouped bar data for Recharts), `getUpcomingEvents` (next 5 events where `start_date >= NOW()`), `getRecentActivity` (last 10 activity_logs). Also create `activityLogsRouter` with `list` (paginated, grouped by day). All dashboard queries are read-only, scoped by unit context. Register both in `appRouter`.
- **Files (7):**
  - `src/server/routers/dashboard/index.ts` ← new: dashboardRouter
  - `src/server/routers/activity-logs/index.ts` ← new: activityLogsRouter
  - `src/lib/validators/dashboard.ts` ← new: dateRangeSchema for chart
  - `src/server/routers/app-router.ts (exists)` ← register both routers
  - `src/server/utils/pagination.ts (exists)` ← reuse for activity log
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
  - `src/lib/decimal-setup.ts (exists)` ← ensure decimal.js used for SPP income aggregation
- **Step Dependencies:** Step 13 (routers), Step 16 (academic year for context)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.
- **Status:** ✅ Done (2026-05-04)

### Step 19: Dashboard Frontend ✅

- **Task:** Wire Dashboard page to real API. Create hooks: `useSummaryCards()`, `useCashflowChart()`, `useUpcomingEvents()`, `useRecentActivity()`. Replace all mock data with oRPC queries. Implement 3-row layout per feature stories: Row 1 = 3 Summary Cards (Total Siswa Aktif, Total Guru Aktif, Pemasukan SPP Bulan Ini with delta badge). Row 2 = Left 60% Recharts BarChart (Forest=income, Amber=expense) + Right 40% upcoming events list. Row 3 = Activity log feed (10 entries, grouped per day). Handle loading skeletons and empty states.
- **Files (12):**
  - `src/features/dashboard/hooks/use-summary-cards.ts` ← new: useQuery
  - `src/features/dashboard/hooks/use-cashflow-chart.ts` ← new: useQuery
  - `src/features/dashboard/hooks/use-upcoming-events.ts` ← new: useQuery
  - `src/features/dashboard/hooks/use-recent-activity.ts` ← new: useQuery
  - `src/features/dashboard/hooks/index.ts` ← new: barrel
  - `src/features/dashboard/components/summary-cards.tsx (exists)` ← wire to real data
  - `src/features/dashboard/components/cashflow-chart.tsx (exists)` ← wire to real data
  - `src/features/dashboard/components/upcoming-events.tsx (exists)` ← wire to real data
  - `src/features/dashboard/components/activity-log.tsx (exists)` ← wire to real data
  - `src/routes/_authenticated/index.tsx (exists)` ← wire to hooks
  - `src/features/dashboard/data/ (exists)` ← remove mock data
  - `src/lib/format.ts (exists)` ← ensure currency formatter uses decimal.js
- **Step Dependencies:** Step 18, Step 17 (academic year UI for context)
- **User Instructions:**
  1. Seed some students, teachers, and transactions for meaningful dashboard data
  2. Run `pnpm dev` — verify all 3 rows render with real data
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`
- **Status:** ✅ Done (2026-05-04)

---

## Section 8 — Teacher Management

> **Refs:** TCH-01–05, Feature Stories §5 (Table, Side Drawer 520px, Bulk Import 4-step), ADR-06 (subjects as JSON), B8, B12

### Step 20: Teacher API Router ✅

- **Task:** Create `teachersRouter` with procedures: `list` (paginated, filterable by status/subject/search via `ilike`, per TCH-02), `create` (full validation, subjects as JSON array per ADR-06, with activity log), `update` (with activity log), `deactivate` (soft-delete: `is_active = false` per TCH-03/B12, with activity log), `getById`. All mutations wrapped by `withActivityLog` middleware. Register in `appRouter`.
- **Files (5):**
  - `src/server/routers/teachers/index.ts` ← new: teachersRouter
  - `src/lib/validators/teachers.ts` ← new: createTeacherSchema, updateTeacherSchema, listTeachersSchema
  - `src/server/routers/app-router.ts (exists)` ← register teachersRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
- **Step Dependencies:** Step 13
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 21: Teacher Frontend — Table & CRUD ✅

- **Task:** Wire Teacher Management page to real API. Create hooks: `useTeachers()` (paginated query with filters), `useCreateTeacher()`, `useUpdateTeacher()`, `useDeactivateTeacher()`, `useTeacherById()`. Replace mock data with oRPC queries. Wire Filter Bar (status dropdown, subject multi-select, "Tampilkan Nonaktif" toggle per feature stories). Wire DataTable with server-side pagination. Wire Add/Edit Side Drawer (520px per feature stories) with react-hook-form + Zod. Wire soft-delete confirmation dialog.
- **Files (14):**
  - `src/features/teachers/hooks/use-teachers.ts` ← new: useQuery with pagination + filters
  - `src/features/teachers/hooks/use-create-teacher.ts` ← new: useMutation
  - `src/features/teachers/hooks/use-update-teacher.ts` ← new: useMutation
  - `src/features/teachers/hooks/use-deactivate-teacher.ts` ← new: useMutation
  - `src/features/teachers/hooks/use-teacher-by-id.ts` ← new: useQuery
  - `src/features/teachers/hooks/index.ts` ← new: barrel
  - `src/features/teachers/components/teacher-table.tsx (exists)` ← wire to useTeachers()
  - `src/features/teachers/components/teacher-filter-bar.tsx (exists)` ← wire to query params
  - `src/features/teachers/components/teacher-form-drawer.tsx (exists)` ← wire to mutations + RHF + Zod
  - `src/features/teachers/components/teacher-columns.tsx (exists)` ← update for real data types
  - `src/routes/_authenticated/teachers/index.tsx (exists)` ← wire to hooks
  - `src/features/teachers/data/ (exists)` ← remove mock data files
  - `src/lib/validators/teachers.ts (exists)` ← reuse for client validation
  - `src/features/teachers/components/deactivate-dialog.tsx (exists)` ← wire to mutation
- **Step Dependencies:** Step 20
- **User Instructions:**
  1. Seed some teacher records or create via the UI
  2. Run `pnpm dev` — test CRUD, filters, pagination, soft-delete
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 22: Teacher Bulk Import & Export ✅

- **Task:** Implement bulk import (TCH-04) and filtered export (TCH-05). Use `xlsx` in the browser to parse uploaded workbooks and generate the downloadable template, then send JSON-safe parsed rows to the server for authoritative preview validation and partial import. Use `exceljs` on the server to generate filtered `.xlsx` exports returned as a JSON-safe base64 payload for browser download. Keep the procedures flat under `tenant.teachers` instead of introducing a new background-jobs subsystem.
- **Files (11):**
  - `src/lib/teachers-bulk.ts` ← new: shared template columns, worksheet parsing, subject splitting, filename helpers
  - `src/lib/__tests__/teachers-bulk.test.ts` ← new: template header, worksheet-row mapping, and subject parsing tests
  - `src/lib/validators/teachers.ts (exists)` ← add import/export schemas and input types
  - `src/server/routers/teachers/index.ts (exists)` ← add `previewImport`, `executeImport`, and `export` procedures
  - `src/server/routers/app-router.ts (exists)` ← register teacher import/export procedures
  - `src/features/teachers/components/teacher-dialogs.tsx (exists)` ← replace placeholders with the live 4-step import flow and filtered export dialog
  - `src/features/teachers/components/teacher-action-buttons.tsx (exists)` ← enable live import/export actions
  - `src/features/teachers/hooks/use-preview-teacher-import.ts` ← new: preview mutation
  - `src/features/teachers/hooks/use-execute-teacher-import.ts` ← new: execute-import mutation + list invalidation
  - `src/features/teachers/hooks/use-export-teachers.ts` ← new: export mutation
  - `package.json (exists)` ← add `xlsx` and `exceljs`
- **Step Dependencies:** Step 21
- **User Instructions:**
  1. Run `pnpm install` after package.json update
  2. Run `pnpm dev` — test template download, workbook upload, preview validation, partial import, and filtered export
  3. Run `pnpm test:run && pnpm typecheck && rtk lint --max-warnings 10 && pnpm build` — must pass
- **Rollback:** `git stash`, `pnpm install` to restore lockfile.

---

## Section 9 — Class & Student Management

> **Refs:** CLS-01–03, STU-01–06, Feature Stories §6–7, ADR-02, B3, B9, B10, B11, C6

### Step 23: Class API Router ✅

- **Task:** Create `classesRouter` with procedures: `list` (by academic year, grouped by grade, with enrollment count vs capacity per CLS-02), `create` (bound to academic year per CLS-01/AY-04), `update`, `getById`, `massPromotion` (transaction: batch UPDATE old enrollments status→'promoted' + batch INSERT new enrollments in target classes per CLS-03). Mass promotion must use `db.transaction(async (tx) => { ... })` with `tx` inside. Register in `appRouter`.
- **Completed:** 2026-05-15 — Added `tenant.classes.list`, `getById`, `create`, `update`, and `massPromotion` in `src/server/routers/classes/index.ts`, added Zod schemas in `src/lib/validators/classes.ts`, and registered `tenant.classes` in `src/server/routers/app-router.ts`. The live implementation uses the tenant-scoped transaction context (`context.tx.transaction(...)`) so RLS state stays intact during mass promotion. `update` now keeps classes bound to their original academic year, and the router scopes joined teacher/student reads by tenant.
- **Files (5):**
  - `src/server/routers/classes/index.ts` ← new: classesRouter
  - `src/lib/validators/classes.ts` ← new: createClassSchema, massPromotionSchema
  - `src/server/routers/app-router.ts (exists)` ← register classesRouter
  - `src/server/shared/index.ts (exists)` ← reuse shared id/error helpers
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
- **Step Dependencies:** Step 16 (academic year dependency)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 24: Class Frontend

- **Task:** Wire Class Management page to real API. Create hooks: `useClasses()`, `useCreateClass()`, `useUpdateClass()`, `useMassPromotion()`. Replace mock data. Implement Class Grid per grade (subheader per grade level, cards with progress bar showing enrollment/capacity per feature stories). Implement Add/Edit form. Implement Mass Promotion 3-step modal per feature stories: Step 1 = Confirm students, Step 2 = Select target classes, Step 3 = Summary & execute. Handle empty state (no classes for active academic year).
- **Completed:** 2026-05-20 — Replaced the mock/local-state classes page with live oRPC + TanStack Query wiring. `src/features/classes/index.tsx` now derives the active academic year from `tenant.academicYears.list`, fetches grouped class cards from `tenant.classes.list`, loads class detail/student rosters from `tenant.classes.getById`, and wires real create/update/mass-promotion mutations. Added live hooks, a query-cache helper, explicit frontend types, grouped class-grid rendering, a live RHF/Zod class dialog with teacher options from `tenant.teachers.list`, and a 3-step mass-promotion modal with explicit target-class error handling. The fake delete/demo flow was removed because no live delete mutation exists.
- **Files (12):**
  - `src/features/classes/hooks/use-classes.ts` ← new: useQuery
  - `src/features/classes/hooks/use-create-class.ts` ← new: useMutation
  - `src/features/classes/hooks/use-update-class.ts` ← new: useMutation
  - `src/features/classes/hooks/use-mass-promotion.ts` ← new: useMutation
  - `src/features/classes/hooks/index.ts` ← new: barrel
  - `src/features/classes/hooks/class-query-cache.ts` ← new: targeted invalidation helpers
  - `src/features/classes/types.ts` ← new: live frontend response/input shapes
  - `src/features/classes/components/class-grid.tsx` ← new: grouped grade cards + card actions
  - `src/features/classes/components/classes-dialog.tsx (exists)` ← rewired to RHF + Zod + live teacher options
  - `src/features/classes/components/kelas-row-actions.tsx (exists)` ← rewired to live actions only (`Lihat Siswa`, `Edit Kelas`)
  - `src/features/classes/components/mass-promotion-modal.tsx` ← new: wire 3-step flow to live target classes and students
  - `src/features/classes/index.tsx (exists)` ← rewired to live queries, detail panel, empty state, and mutations
  - `src/lib/validators/classes.ts (exists)` ← reuse for client validation
- **Step Dependencies:** Step 23, Step 17 (academic year UI for context)
- **User Instructions:**
  1. Create classes for the active academic year
  2. Run `pnpm dev` — test CRUD, grid display, capacity tracking
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 25: Student API Router ✅

- **Task:** Create `studentsRouter` with procedures: `list` (paginated, server-side search/filter per STU-02, filterable by class/status/search), `create` (dual insert: `students` + `enrollments` in one transaction per STU-01/B3), `update`, `getById` (with enrollment history + payment history for detail page per STU-03), `changeStatus` (writes to `enrollment_status_history` with old_status, new_status, changed_by, metadata per STU-04/B10/C6 — supports transfer, graduate, dropout), `getStatusHistory`. NISN uniqueness enforced per school (B9). No permanent delete (STU-06/B11). Register in `appRouter`.
- **Files (6):**
  - `src/server/routers/students/index.ts` ← new: studentsRouter
  - `src/lib/validators/students.ts` ← new: createStudentSchema, changeStatusSchema, listStudentsSchema
  - `src/server/routers/app-router.ts (exists)` ← register studentsRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
  - `src/server/db/schema/enrollments.ts (exists)` ← verify status enum includes all values
- **Step Dependencies:** Step 23 (classes must exist for enrollment)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.
- **Status:** ✅ Complete — all 6 procedures implemented, build passing, router registered in app-router.ts

### Step 26: Student Frontend — List & Registration

- **Task:** Wire Student list page and registration to real API. Create hooks: `useStudents()` (paginated with server-side filters), `useCreateStudent()`, `useUpdateStudent()`, `useStudentById()`. Replace mock data. Wire search/filter/pagination per feature stories. Wire Registration Drawer with react-hook-form + Zod (auto-enroll to active academic year + selected class per STU-01). Handle NISN duplicate detection (show inline error). Handle empty state.
- **Files (12):**
  - `src/features/students/hooks/use-students.ts` ← new: useQuery with pagination + filters
  - `src/features/students/hooks/use-create-student.ts` ← new: useMutation
  - `src/features/students/hooks/use-update-student.ts` ← new: useMutation
  - `src/features/students/hooks/use-student-by-id.ts` ← new: useQuery
  - `src/features/students/hooks/index.ts` ← new: barrel
  - `src/features/students/components/student-table.tsx (exists)` ← wire to useStudents()
  - `src/features/students/components/student-filter-bar.tsx (exists)` ← wire to query params
  - `src/features/students/components/student-form-drawer.tsx (exists)` ← wire to mutations + RHF + Zod
  - `src/features/students/components/student-columns.tsx (exists)` ← update for real data types
  - `src/routes/_authenticated/students/index.tsx (exists)` ← wire to hooks
  - `src/features/students/data/ (exists)` ← remove mock data files
  - `src/lib/validators/students.ts (exists)` ← reuse for client validation
- **Step Dependencies:** Step 25, Step 24 (classes for enrollment dropdown)
- **User Instructions:**
  1. Ensure classes exist for the active academic year
  2. Run `pnpm dev` — test registration, search, filter, pagination
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 27: Student Detail Page & Status Transitions

- **Task:** Wire Student detail page with tabs (Profil, Enrollment, Pembayaran per STU-03/feature stories). Create hooks: `useStudentDetail()` (combined profile + enrollment history + payment history), `useChangeStudentStatus()`. Implement status transition dialogs per type (Transfer: target school field, Graduate: ceremony date, Dropout: reason — per feature stories). Each transition writes to `enrollment_status_history` (C6/B10). Wire enrollment history timeline. Payment tab will show real data after SPP steps.
- **Files (10):**
  - `src/features/students/hooks/use-student-detail.ts` ← new: useQuery (combined data)
  - `src/features/students/hooks/use-change-student-status.ts` ← new: useMutation
  - `src/features/students/components/student-detail-page.tsx (exists)` ← wire to real data
  - `src/features/students/components/student-profile-tab.tsx (exists)` ← wire to real data
  - `src/features/students/components/student-enrollment-tab.tsx (exists)` ← wire to real data
  - `src/features/students/components/student-payment-tab.tsx (exists)` ← wire to real data (placeholder until SPP)
  - `src/features/students/components/status-transition-dialog.tsx (exists)` ← wire to mutation
  - `src/routes/_authenticated/students/$studentId.tsx (exists)` ← wire to hooks
  - `src/lib/validators/students.ts (exists)` ← add changeStatusSchema
  - `src/features/students/hooks/index.ts (exists)` ← update barrel
- **Step Dependencies:** Step 26
- **User Instructions:**
  1. Create students and test status transitions
  2. Run `pnpm dev` — test detail page tabs, status changes
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

---

## Section 10 — SPP Payment System

> **Refs:** SPP-01–10, Feature Stories §8, ADR-03 (computed status), ADR-04 (append-only), ADR-07 (decimal.js), B4, B5, B6, B7

### Step 28: SPP Configuration API Router

- **Task:** Create `sppRouter` (config sub-router) with procedures: `categories.list`, `categories.create`, `categories.update` (payment category CRUD — Bulanan/Tahunan/Insidental per SPP-01), `rates.list` (matrix: rate per category per class), `rates.upsert` (batch upsert rates per SPP-02), `discounts.list`, `discounts.create`, `discounts.update`, `discounts.lock` (auto-lock `is_locked` mid-year per SPP-03). All financial amounts use `decimal.js` for computation and `numeric(15,2)` in DB (ADR-07). Register in `appRouter`.
- **Files (7):**
  - `src/server/routers/spp/index.ts` ← new: sppRouter (composes config + payments + monitoring)
  - `src/server/routers/spp/config.ts` ← new: categories, rates, discounts procedures
  - `src/lib/validators/spp.ts` ← new: categorySchema, rateSchema, discountSchema
  - `src/server/routers/app-router.ts (exists)` ← register sppRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
  - `src/lib/decimal-setup.ts (exists)` ← ensure decimal.js used in all amount handling
- **Step Dependencies:** Step 23 (classes for rates matrix)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 29: SPP Configuration Frontend

- **Task:** Wire SPP Configuration page to real API. Create hooks for categories, rates, and discounts CRUD. Implement tabbed UI per feature stories: Tab 1 = Payment Categories (table + add/edit), Tab 2 = Class Payment Rates (matrix grid: rows=classes, cols=categories, cells=editable amounts), Tab 3 = Discount Schemes (per student per category, with lock indicator). All amount inputs must use decimal.js for display/validation (ADR-07). Wire react-hook-form + Zod for all forms.
- **Files (14):**
  - `src/features/spp/hooks/use-payment-categories.ts` ← new: useQuery + useMutation
  - `src/features/spp/hooks/use-class-rates.ts` ← new: useQuery + useMutation (batch upsert)
  - `src/features/spp/hooks/use-discount-schemes.ts` ← new: useQuery + useMutation
  - `src/features/spp/hooks/index.ts` ← new: barrel
  - `src/features/spp/components/spp-config-tabs.tsx (exists)` ← wire to real data
  - `src/features/spp/components/category-table.tsx (exists)` ← wire to hooks
  - `src/features/spp/components/category-form.tsx (exists)` ← wire to mutation + RHF + Zod
  - `src/features/spp/components/rates-matrix.tsx (exists)` ← wire to hooks (editable grid)
  - `src/features/spp/components/discount-table.tsx (exists)` ← wire to hooks
  - `src/features/spp/components/discount-form.tsx (exists)` ← wire to mutation + RHF + Zod
  - `src/routes/_authenticated/spp/index.tsx (exists)` ← wire to hooks
  - `src/features/spp/data/mock-data.ts (exists)` ← remove mock data
  - `src/lib/validators/spp.ts (exists)` ← reuse for client validation
  - `src/lib/decimal-setup.ts (exists)` ← ensure decimal.js used in amount display
- **Step Dependencies:** Step 28, Step 24 (classes for rates matrix)
- **User Instructions:**
  1. Create payment categories and set rates for classes
  2. Run `pnpm dev` — test category CRUD, rates matrix editing, discount management
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 30: SPP Payment Recording API

- **Task:** Create payment recording procedures in `sppRouter`: `payments.getStudentBills` (bills for selected student with computed status via SQL aggregation per ADR-03 — NEVER store status), `payments.record` (4-step flow backend: validate bill, INSERT `payment_transactions`, handle overpayment as second transaction per SPP-05, auto-INSERT `cashflow_transactions` in same transaction block per SPP-07/B7, all in `db.transaction()`), `payments.reverse` (new reversal transaction linked via `reversedById` per SPP-06/ADR-04/B6 — append-only, no UPDATE/DELETE on payment_transactions per B5). All amounts computed with `decimal.js` (ADR-07).
- **Files (5):**
  - `src/server/routers/spp/payments.ts` ← new: recording procedures
  - `src/lib/validators/spp.ts (exists)` ← add recordPaymentSchema, reversePaymentSchema
  - `src/server/routers/spp/index.ts (exists)` ← compose payments sub-router
  - `src/lib/decimal-setup.ts (exists)` ← critical: all amount math via decimal.js
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse (withActivityLog for mutations)
- **Step Dependencies:** Step 28 (config must exist), Step 25 (students for bills)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Revert new/modified files.

### Step 31: SPP Payment Recording Frontend

- **Task:** Wire 4-step payment recording flow per feature stories (SPP-04): Step 1 = Select student (search/autocomplete), Step 2 = Select bills (show computed status: paid/partial/unpaid — NEVER from stored field per ADR-03), Step 3 = Input payment amount (decimal.js validation, show overpayment warning per SPP-05), Step 4 = Confirmation & receipt. Create hooks: `useStudentBills()`, `useRecordPayment()`, `useReversePayment()`. Wire reversal flow (SPP-06): select transaction → confirm reversal → new reversal record. All amount displays use decimal.js formatting (ADR-07).
- **Files (12):**
  - `src/features/spp/hooks/use-student-bills.ts` ← new: useQuery
  - `src/features/spp/hooks/use-record-payment.ts` ← new: useMutation
  - `src/features/spp/hooks/use-reverse-payment.ts` ← new: useMutation
  - `src/features/spp/components/payment-recording-wizard.tsx (exists)` ← wire 4-step flow
  - `src/features/spp/components/student-selector.tsx (exists)` ← wire to student search
  - `src/features/spp/components/bill-selector.tsx (exists)` ← wire to useStudentBills()
  - `src/features/spp/components/payment-amount-input.tsx (exists)` ← decimal.js validation
  - `src/features/spp/components/payment-confirmation.tsx (exists)` ← wire to useRecordPayment()
  - `src/features/spp/components/reversal-dialog.tsx (exists)` ← wire to useReversePayment()
  - `src/routes/_authenticated/spp/record.tsx (exists)` ← wire to hooks
  - `src/lib/validators/spp.ts (exists)` ← reuse for client validation
  - `src/features/spp/hooks/index.ts (exists)` ← update barrel
- **Step Dependencies:** Step 30, Step 29 (config UI), Step 26 (students)
- **User Instructions:**
  1. Ensure students have bills (auto-generated or manually created)
  2. Run `pnpm dev` — test full 4-step recording, overpayment, reversal
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 32: SPP Monitoring API — Payment Matrix & Arrears

- **Task:** Create monitoring procedures in `sppRouter`: `monitoring.getPaymentMatrix` (grid: students × months, status computed via SQL aggregation per ADR-03/SPP-08 — uses SUM of payment_transactions vs net_amount on payment_bills), `monitoring.getArrears` (outstanding balances per student per SPP-09), `monitoring.getStudentPaymentSummary`. All status values are computed at query time, never stored. Amounts aggregated with SQL `SUM()` and returned as strings for decimal.js parsing on client.
- **Files (4):**
  - `src/server/routers/spp/monitoring.ts` ← new: monitoring procedures
  - `src/lib/validators/spp.ts (exists)` ← add matrixFilterSchema, arrearsFilterSchema
  - `src/server/routers/spp/index.ts (exists)` ← compose monitoring sub-router
  - `src/lib/decimal-setup.ts (exists)` ← ensure amounts returned as strings
- **Step Dependencies:** Step 30 (payments must exist for meaningful matrix)
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Revert new/modified files.

### Step 33: SPP Monitoring Frontend — Payment Matrix

- **Task:** Wire Payment Matrix UI per feature stories (SPP-08): grid with students as rows, months as columns, cells showing computed status (paid=green, partial=amber, unpaid=red, no-bill=gray). Implement sticky headers (both row and column per feature stories). Wire arrears table (SPP-09): outstanding balances per student with total. Create hooks: `usePaymentMatrix()`, `useArrears()`. All amount displays use decimal.js (ADR-07).
- **Files (10):**
  - `src/features/spp/hooks/use-payment-matrix.ts` ← new: useQuery
  - `src/features/spp/hooks/use-arrears.ts` ← new: useQuery
  - `src/features/spp/components/payment-matrix.tsx (exists)` ← wire to real data, sticky headers
  - `src/features/spp/components/payment-matrix-cell.tsx (exists)` ← computed status colors
  - `src/features/spp/components/arrears-table.tsx (exists)` ← wire to real data
  - `src/routes/_authenticated/spp/monitoring.tsx (exists)` ← wire to hooks
  - `src/features/spp/hooks/index.ts (exists)` ← update barrel
  - `src/lib/validators/spp.ts (exists)` ← reuse
  - `src/lib/decimal-setup.ts (exists)` ← amount formatting
  - `src/lib/format.ts (exists)` ← currency formatting helper
- **Step Dependencies:** Step 32, Step 31 (recording for test data)
- **User Instructions:**
  1. Record some payments to populate the matrix
  2. Run `pnpm dev` — test matrix display, sticky headers, arrears table
  3. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 34: SPP Bill Auto-Generation Job

- **Task:** Create pg-boss job for automatic bill generation (SPP-10). Job runs periodically (configurable, e.g., monthly) and creates `payment_bills` for all active students based on their class payment rates minus applicable discounts. Uses `db.transaction()` for batch insert. Job registered in pg-boss worker (colocated per C3). Net amount = rate - discount (computed with decimal.js per ADR-07). Locked discounts (`is_locked = true`) cannot be modified after mid-year.
- **Files (6):**
  - `src/server/jobs/bill-generation.ts` ← new: pg-boss job handler
  - `src/server/jobs/index.ts (exists)` ← register bill generation job
  - `src/server/routers/spp/index.ts (exists)` ← add manual trigger procedure (for admin)
  - `src/lib/validators/spp.ts (exists)` ← add billGenerationSchema
  - `src/lib/decimal-setup.ts (exists)` ← net amount calculation
  - `src/server/db/schema/spp.ts (exists)` ← verify billing_month CHECK constraint
- **Step Dependencies:** Step 28 (config), Step 25 (students with enrollments)
- **User Instructions:**
  1. Run `pnpm dev` — trigger bill generation manually via admin procedure
  2. Verify bills created for all active students
  3. Run `pnpm build` — must pass
- **Rollback:** Revert new/modified files.

---

## Section 11 — Cashflow, Events & Export

> **Refs:** CF-01–04, EVT-01–04, Feature Stories §9–10, B7, B13

### Step 35: Cashflow API Router

- **Task:** Create `cashflowRouter` with procedures: `categories.list`, `categories.create` (income/expense categories per CF-01), `transactions.list` (paginated, filterable by date range/category/type), `transactions.create` (manual income/expense entry per CF-01), `transactions.update` (only if `spp_payment_id IS NULL` — auto-linked entries are locked per CF-04/B7), `transactions.delete` (only if `spp_payment_id IS NULL`), `summary.get` (3 cards: total income, total expense, net balance per CF-02 — computed with decimal.js per ADR-07), `chart.get` (6-month grouped bar data per CF-03). Register in `appRouter`.
- **Files (6):**
  - `src/server/routers/cashflow/index.ts` ← new: cashflowRouter
  - `src/lib/validators/cashflow.ts` ← new: createTransactionSchema, categorySchema, summaryFilterSchema
  - `src/server/routers/app-router.ts (exists)` ← register cashflowRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
  - `src/lib/decimal-setup.ts (exists)` ← all amount math via decimal.js
- **Step Dependencies:** Step 13
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 36: Cashflow Frontend

- **Task:** Wire Cashflow page to real API. Create hooks: `useCashflowSummary()`, `useCashflowTransactions()`, `useCashflowChart()`, `useCreateTransaction()`, `useUpdateTransaction()`, `useDeleteTransaction()`, `useCashflowCategories()`. Replace mock data. Implement per feature stories: 3 Summary Cards (Pemasukan green, Pengeluaran red, Saldo blue/gray), Filter Bar (date range, category, type toggle), Transaction Table (with auto-link badge for SPP entries — hide edit/delete actions when `sppPaymentId` exists per CF-04/B7), Add Modal (toggle income/expense, category dropdown, amount with decimal.js, description, date). Chart uses Recharts grouped bar (same as dashboard but full-page).
- **Files (14):**
  - `src/features/cashflow/hooks/use-cashflow-summary.ts` ← new: useQuery
  - `src/features/cashflow/hooks/use-cashflow-transactions.ts` ← new: useQuery with filters
  - `src/features/cashflow/hooks/use-cashflow-chart.ts` ← new: useQuery
  - `src/features/cashflow/hooks/use-create-transaction.ts` ← new: useMutation
  - `src/features/cashflow/hooks/use-cashflow-categories.ts` ← new: useQuery
  - `src/features/cashflow/hooks/index.ts` ← new: barrel
  - `src/features/cashflow/components/cashflow-summary-cards.tsx (exists)` ← wire to real data
  - `src/features/cashflow/components/cashflow-table.tsx (exists)` ← wire to real data + auto-link badge
  - `src/features/cashflow/components/cashflow-filter-bar.tsx (exists)` ← wire to query params
  - `src/features/cashflow/components/cashflow-chart.tsx (exists)` ← wire to real data
  - `src/features/cashflow/components/cashflow-form-modal.tsx (exists)` ← wire to mutation + RHF + Zod
  - `src/routes/_authenticated/cashflow/index.tsx (exists)` ← wire to hooks
  - `src/lib/validators/cashflow.ts (exists)` ← reuse for client validation
  - `src/lib/decimal-setup.ts (exists)` ← amount formatting
- **Step Dependencies:** Step 35
- **User Instructions:**
  1. Create cashflow categories and manual transactions
  2. Verify SPP auto-linked entries appear with badge and locked actions
  3. Run `pnpm dev` — test CRUD, filters, chart, summary cards
  4. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 37: Events API Router

- **Task:** Create `eventsRouter` with procedures: `list` (paginated, filterable by category/status/date range per EVT-02), `create` (with category enum + status enum per EVT-01), `update`, `getById`, `delete`. Summary procedure: `getSummary` (4 counts: total, upcoming, ongoing, completed per feature stories). Status does NOT auto-transition (B13 — no automatic status changes without explicit instruction). Register in `appRouter`.
- **Files (5):**
  - `src/server/routers/events/index.ts` ← new: eventsRouter
  - `src/lib/validators/events.ts` ← new: createEventSchema, updateEventSchema, listEventsSchema
  - `src/server/routers/app-router.ts (exists)` ← register eventsRouter
  - `src/server/utils/pagination.ts (exists)` ← reuse
  - `src/server/routers/middlewares/index.ts (exists)` ← reuse
- **Step Dependencies:** Step 13
- **User Instructions:** Run `pnpm build` — must pass.
- **Rollback:** Delete new files, revert `app-router.ts`.

### Step 38: Events Frontend — Table & Calendar

- **Task:** Wire Events page to real API. Install missing dependency: `react-big-calendar`. Create hooks: `useEvents()`, `useCreateEvent()`, `useUpdateEvent()`, `useDeleteEvent()`, `useEventSummary()`, `useEventById()`. Replace mock data. Implement per feature stories: 4 Summary Cards (Total, Mendatang, Berlangsung, Selesai), Tab Toggle (DataTable vs Calendar view per EVT-02), DataTable with sortable columns and filters, Calendar view (monthly, colored chips per category per EVT-03), Side Drawer (480px, detail view + edit form per EVT-04). Wire react-hook-form + Zod for event form.
- **Files (15):**
  - `src/features/events/hooks/use-events.ts` ← new: useQuery with filters
  - `src/features/events/hooks/use-create-event.ts` ← new: useMutation
  - `src/features/events/hooks/use-update-event.ts` ← new: useMutation
  - `src/features/events/hooks/use-delete-event.ts` ← new: useMutation
  - `src/features/events/hooks/use-event-summary.ts` ← new: useQuery
  - `src/features/events/hooks/index.ts` ← new: barrel
  - `src/features/events/components/event-summary-cards.tsx (exists)` ← wire to real data
  - `src/features/events/components/event-table.tsx (exists)` ← wire to real data
  - `src/features/events/components/event-calendar.tsx (exists)` ← wire to real data + react-big-calendar
  - `src/features/events/components/event-form-drawer.tsx (exists)` ← wire to mutations + RHF + Zod
  - `src/features/events/components/event-columns.tsx (exists)` ← update for real data types
  - `src/routes/_authenticated/events/index.tsx (exists)` ← wire to hooks
  - `src/features/events/data/ (exists)` ← remove mock data files
  - `src/lib/validators/events.ts (exists)` ← reuse for client validation
  - `package.json (exists)` ← add react-big-calendar + @types/react-big-calendar
- **Step Dependencies:** Step 37
- **User Instructions:**
  1. Run `pnpm install` after package.json update
  2. Create events with different categories
  3. Run `pnpm dev` — test table view, calendar view, CRUD, colored chips
  4. Run `pnpm build` — must pass
- **Rollback:** `git stash`, `pnpm install` to restore lockfile.

### Step 39: User Management & RBAC Frontend

- **Task:** Wire User Management page to real API. Enhance `admin/users.ts` router (from Step 12) with proper pagination, search, and role-based access (only `super_admin` can manage users per RBAC matrix). Create hooks: `useUsers()`, `useCreateUser()`, `useAssignRole()`, `useToggleAssignment()`. Implement per feature stories: user table with role badges, progressive disclosure for assignment details, Add User form (creates Better Auth user + assignment in transaction), Role Assignment form (unit + role selection). Wire react-hook-form + Zod.
- **Files (12):**
  - `src/server/routers/admin/users.ts (exists)` ← enhance: add pagination, search, role checks
  - `src/features/users/hooks/use-users.ts` ← new: useQuery with pagination
  - `src/features/users/hooks/use-create-user.ts` ← new: useMutation
  - `src/features/users/hooks/use-assign-role.ts` ← new: useMutation
  - `src/features/users/hooks/use-toggle-assignment.ts` ← new: useMutation
  - `src/features/users/hooks/index.ts` ← new: barrel
  - `src/features/users/components/user-table.tsx (exists)` ← wire to real data + role badges
  - `src/features/users/components/user-form-drawer.tsx (exists)` ← wire to mutations + RHF + Zod
  - `src/features/users/components/role-assignment-form.tsx (exists)` ← wire to mutation
  - `src/routes/_authenticated/users/index.tsx (exists)` ← wire to hooks
  - `src/features/users/data/ (exists)` ← remove mock data files
  - `src/lib/validators/users.ts` ← new: createUserSchema, assignRoleSchema
- **Step Dependencies:** Step 12 (oRPC foundation), Step 11 (auth flow)
- **User Instructions:**
  1. Login as super_admin
  2. Run `pnpm dev` — test user CRUD, role assignment, toggle activation
  3. Verify non-super_admin users cannot access user management
  4. Run `pnpm build` — must pass
- **Rollback:** `git stash`

### Step 40: Student Bulk Import & Final Polish

- **Task:** Implement student bulk import (STU-05) with NISN duplicate detection (B9). Install `xlsx` if not already added in Step 22. Create pg-boss job for bulk student import. Implement 4-step import flow (same pattern as teacher import): Download Template → Upload → Preview with NISN duplicate highlighting → Confirm. Each imported student creates both `students` + `enrollments` records in transaction (STU-01/B3). Also wire student payment tab to real SPP data (now that SPP is complete). Final cleanup: remove all remaining mock data files across all features, verify no `data/` directories with mock data remain.
- **Files (12):**
  - `src/server/routers/students/import.ts` ← new: import procedures
  - `src/server/jobs/student-import.ts` ← new: pg-boss job handler
  - `src/server/jobs/index.ts (exists)` ← register student import job
  - `src/features/students/components/bulk-import-modal.tsx (exists)` ← wire 4-step flow
  - `src/features/students/components/import-preview-table.tsx` ← new: validation preview with NISN check
  - `src/features/students/hooks/use-import-students.ts` ← new: useMutation
  - `src/features/students/hooks/index.ts (exists)` ← update barrel
  - `src/lib/validators/students.ts (exists)` ← add importRowSchema with NISN validation
  - `src/features/students/templates/student-import-template.xlsx` ← new: Excel template
  - `src/features/students/components/student-payment-tab.tsx (exists)` ← wire to real SPP data
  - `src/server/routers/students/index.ts (exists)` ← add import procedures
  - `src/server/routers/app-router.ts (exists)` ← verify student router complete
- **Step Dependencies:** Step 27 (student detail), Step 33 (SPP monitoring for payment tab)
- **User Instructions:**
  1. Run `pnpm install` if xlsx was newly added
  2. Test bulk import with valid and invalid NISN data
  3. Verify payment tab shows real SPP data on student detail page
  4. Run `pnpm build` — must pass
- **Rollback:** `git stash`

---

## Appendix A — Cross-Reference Matrix

| PRD Feature | Steps | ADRs | Business Rules |
|-------------|-------|------|----------------|
| Full-stack Framework (PRD §1.2) | 0 | ADR-01 | — |
| MT-01–05 (Tenant) | 14, 15 | ADR-02 | B1 |
| AUTH-01–05 (Auth) | 0, 8, 9, 10, 11, 39 | ADR-01, C7, C9 | — |
| AY-01–04 (Academic Year) | 16, 17 | — | B2 |
| DASH-01–05 (Dashboard) | 18, 19 | ADR-03, ADR-07 | B4 |
| TCH-01–05 (Teachers) | 20, 21, 22 | ADR-06 | B8, B12 |
| CLS-01–03 (Classes) | 23, 24 | — | B3 |
| STU-01–06 (Students) | 25, 26, 27, 40 | — | B3, B9, B10, B11 |
| SPP-01–10 (Payments) | 28, 29, 30, 31, 32, 33, 34 | ADR-03, ADR-04, ADR-07 | B4, B5, B6, B7 |
| CF-01–04 (Cashflow) | 35, 36 | ADR-07 | B7 |
| EVT-01–04 (Events) | 37, 38 | — | B13 |

## Appendix B — Dependency Graph (Simplified)

```
Section 1–2 (Done) ──→ Section 2.5 (TanStack Start SPA) ──→ Section 3 (Auth) ──→ Section 4 (oRPC Foundation)
                                                                                          │
                                                          ┌───────────────────────────────┤
                                                          ▼                               ▼
                                                    Section 5 (Tenant)              Section 6 (Academic Year)
                                                          │                               │
                                                          ▼                               ▼
                                                    Section 7 (Dashboard)           Section 8 (Teachers)
                                                                                          │
                                                                                    Section 9 (Classes → Students)
                                                                                          │
                                                                                    Section 10 (SPP)
                                                                                          │
                                                                                    Section 11 (Cashflow, Events, Users, Polish)
```

## Appendix C — Known Issues to Resolve

| # | Issue | Resolved In |
|---|-------|-------------|
| 1 | No oRPC routers exist | Step 12 |
| 2 | All frontend uses mock data | Steps 15–40 (progressive) |
| 3 | No DB migrations pushed | Step 11 (User Instruction) |
| 4 | Better Auth server is dead code | Step 9 ✅ |
| 5 | `src/lib/auth.ts` wrong location | Step 8 |
| 6 | `userSchoolAssignments.userId` missing FK | Step 8 |
| 7 | Auth schema missing `hashedPassword` | Step 8 (verify — Better Auth stores in `account`) |
| 8 | Admin router has no role check | Step 12 |
| 9 | `@tanstack/react-start` in devDeps but unused | Step 0 (move to deps + activate via tanstackStart plugin) |
| 10 | Drizzle migration drift | Step 8 |
| 11 | Large chunk warning (581KB) | Step 3 (Done) |
| 12 | Role name mismatch in constants | Step 11 |
| 13 | `authorized.ts` missing EDARA fields | Step 10 ✅ |
| 14 | Missing npm packages (xlsx, react-big-calendar) | Steps 22, 38 |
| 15 | Mock auth store not connected | Step 11 |
