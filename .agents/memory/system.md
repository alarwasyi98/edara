# System Memory — EDARA

> Layer 1: Invariants, tech stack, constraints, and naming conventions.
> This file is the single source of truth for architectural constants.
> **Do NOT modify** unless a formal ADR overrides an entry.

---

## Project Identity

- **Name:** EDARA (Sistem Administrasi Madrasah Multi-Tenant)
- **Phase:** Phase 1 — Migration from Mock to Real Backend
- **Language:** TypeScript (strict mode, no `any`)
- **Runtime:** Browser-only SPA (no SSR in Phase 1)
- **OS:** Windows (primary dev environment — use PowerShell equivalents)

## Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|----------------|
| Frontend Framework | React | 19 |
| Meta-framework | TanStack Start | Vite SPA mode — **NO SSR** |
| Routing | TanStack Router | File-based, type-safe |
| Server State | TanStack Query | Via oRPC integration |
| Client State | Zustand | Minimal stores |
| Styling | Tailwind CSS | v4 |
| Component Library | shadcn/ui | Radix primitives |
| API Layer | oRPC | Type-safe RPC |
| Authentication | Better Auth | Identity & session management |
| Authorization | EDARA RBAC | `user_school_assignments` table |
| ORM | Drizzle ORM | PostgreSQL dialect |
| Database | Neon | Serverless PostgreSQL |
| Job Queue | pg-boss | Colocated (same server process) |
| Financial Math | decimal.js | Mandatory for all money ops |
| Package Manager | pnpm | With rollup 4.60.0 override |
| Forms | react-hook-form + zod | Validation via Zod resolvers |

## Architectural Constraints

1. **Vite SPA (ADR-01):** No SSR code (`loader`, `getServerSideProps`). All data fetching via oRPC + TanStack Query on the client.
2. **Multi-Tenancy & RLS (ADR-02):** Every tenant-scoped table MUST have `school_id` (and `unit_id` if under a unit). RLS enforced at DB level via `set_config()` before queries.
3. **Computed Financial Status (ADR-03):** SPP status (paid/partial/unpaid) is NEVER stored as a static column. Always compute via SQL aggregation (`SUM(amount)` vs `net_amount`).
4. **Append-Only Transactions (ADR-04):** `payment_transactions` table has NO UPDATE or DELETE at application level. Corrections use new `reversal` type transactions.
5. **Centralized Activity Logs (ADR-05):** No manual `db.insert(activityLogs)` inside mutation blocks. Must use `withActivityLog` middleware on oRPC procedures.
6. **Subjects as JSON (ADR-06):** `mataPelajaran` column on `teachers` table uses JSON array (text type), not a junction table.
7. **Financial Precision (ADR-07):** FORBIDDEN to use `Number()`, `parseInt`, `parseFloat`, or native JS arithmetic (`+`, `-`, `*`, `/`) for financial logic. MUST use `decimal.js` (`new Decimal(value)`). Database columns use `numeric(15,2)` type.
8. **Auth Schema (C7):** Authentication uses Better Auth. Roles and unit assignments managed via EDARA `user_school_assignments` table, NOT local simulation.

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Files / Folders | `kebab-case` | `student-form-drawer.tsx` |
| React Components | `PascalCase` | `StudentFormDrawer` |
| Functions / Hooks | `camelCase` | `useStudentData` |
| DB Tables / Columns | `snake_case` | `payment_transactions`, `academic_year_id` |
| Zod Schemas | `camelCase` + "Schema" suffix | `teacherCreateSchema` |
| Route paths | English | `/teachers`, `/students`, `/cashflow` |
| Sidebar labels | Indonesian | Per Option B convention |
| String literals (UI) | Indonesian (unchanged) | Labels, placeholders |
| DB schema identifiers | English | Column names, table names |

## RBAC Roles

| Role | Scope |
|------|-------|
| `super_admin` | Full system access |
| `kepala_sekolah` | School-level oversight |
| `admin_tu` | Administrative operations |
| `bendahara` | Financial operations |

## Dev Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm format:check # Prettier check
pnpm test         # Vitest (watch mode)
pnpm test:run     # Vitest (once)
pnpm db:generate  # Drizzle: generate migrations
pnpm db:push      # Drizzle: push schema to DB
```

## CI Pipeline (GitHub Actions)

Run in this order:
1. `pnpm format:check`
2. `pnpm typecheck`
3. `pnpm lint --max-warnings 10`
4. `pnpm build`

## Environment Quirks

- **pnpm overrides:** `package.json` has `pnpm.overrides.rollup` forcing version 4.60.0
- **ESLint warnings:** 8 warnings from `react-hooks/incompatible-library` for TanStack Table — safe to ignore (baseline)
- **Build warning:** Large chunk (581KB) — future optimization target
- **No SSR:** Never generate `loader` functions; use `useQuery` / `useMutation` instead
- **Windows dev:** Use PowerShell 7 commands; UNIX commands may not work reliably
