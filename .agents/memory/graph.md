# Dependency Graph — EDARA

> Layer 4: Relationship map between modules, features, and infrastructure.
> Shows how components connect and depend on each other.

---

## Module Dependency Map

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                                                         │
│  TanStack Router ──→ Route Guards ──→ Better Auth Client│
│       │                                                 │
│       ▼                                                 │
│  Feature Modules ──→ oRPC Client ──→ TanStack Query     │
│  (teachers, students, spp, cashflow, events, dashboard) │
│       │                                                 │
│       ▼                                                 │
│  Zustand Stores (tenant-store, ui-store)                │
│       │                                                 │
│       ▼                                                 │
│  shadcn/ui + Tailwind CSS v4                            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (oRPC)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│                                                         │
│  oRPC Router (appRouter)                                │
│       │                                                 │
│       ├──→ Auth Middleware (Better Auth session verify)  │
│       ├──→ RLS Middleware (set_config for tenant)        │
│       ├──→ RBAC Middleware (requireRole)                 │
│       └──→ Activity Log Middleware (withActivityLog)     │
│       │                                                 │
│       ▼                                                 │
│  Domain Routers                                         │
│  ├── tenantRouter (schools, units)                      │
│  ├── authRouter (Better Auth handlers)                  │
│  ├── usersRouter (assignments, roles)                   │
│  ├── academicYearsRouter                                │
│  ├── dashboardRouter                                    │
│  ├── teachersRouter                                     │
│  ├── classesRouter                                      │
│  ├── studentsRouter                                     │
│  ├── sppRouter (config, payments, monitoring)           │
│  ├── cashflowRouter                                     │
│  ├── eventsRouter                                       │
│  └── reportsRouter                                      │
│       │                                                 │
│       ▼                                                 │
│  Drizzle ORM ──→ Neon PostgreSQL (with RLS)             │
│       │                                                 │
│       ▼                                                 │
│  pg-boss (colocated job queue)                          │
│  ├── bulk-import-teachers                               │
│  ├── generate-bills                                     │
│  └── generate-excel-report                              │
└─────────────────────────────────────────────────────────┘
```

## Database Table Relationships

```
schools (root tenant)
├── school_units (1:N)
│   ├── academic_years (1:N, scoped to unit)
│   ├── teachers (1:N)
│   ├── classes (1:N, linked to academic_year)
│   │   ├── enrollments (1:N, links student ↔ class)
│   │   │   └── enrollment_status_history (1:N)
│   │   └── class_payment_rates (1:N, links class ↔ payment_category)
│   ├── students (1:N)
│   │   └── discount_schemes (1:N, per student per category)
│   ├── payment_categories (1:N)
│   │   └── payment_bills (1:N, per student per month)
│   │       └── payment_transactions (1:N, append-only)
│   │           └── cashflow_transactions (1:1 auto-link, optional)
│   ├── cashflow_categories (1:N)
│   │   └── cashflow_transactions (1:N)
│   └── school_events (1:N)
├── user_school_assignments (1:N, links user ↔ school ↔ unit ↔ role)
└── activity_logs (1:N, audit trail)

Better Auth (separate domain):
├── user (identity)
├── session (active sessions)
├── account (OAuth providers)
└── verification (email/phone verification)
```

## Feature → Table Mapping

| Feature | Primary Tables | Supporting Tables |
|---------|---------------|-------------------|
| Multi-Tenant | `schools`, `school_units` | `user_school_assignments` |
| Auth & RBAC | `user`, `session`, `account` | `user_school_assignments` |
| Academic Year | `academic_years` | — |
| Dashboard | — (aggregation queries) | All tables |
| Teachers | `teachers` | `activity_logs` |
| Classes | `classes` | `enrollments` |
| Students | `students`, `enrollments` | `enrollment_status_history` |
| SPP Config | `payment_categories`, `class_payment_rates`, `discount_schemes` | — |
| SPP Payment | `payment_bills`, `payment_transactions` | `cashflow_transactions` |
| Cashflow | `cashflow_categories`, `cashflow_transactions` | `payment_transactions` |
| Events | `school_events` | — |

## Auth Flow (Better Auth + EDARA RBAC)

```
Browser → Better Auth Client SDK
    │
    ├── Sign In/Up → Better Auth Server → user table
    │
    ├── Session Check → Better Auth getSession()
    │       │
    │       ▼
    │   Route Guard (_authenticated)
    │       │
    │       ▼
    │   oRPC Request (with session token)
    │       │
    │       ▼
    │   Auth Middleware (verify session)
    │       │
    │       ▼
    │   Assignment Resolution (user_school_assignments)
    │       │
    │       ▼
    │   RLS Context (set_config school_id, unit_id)
    │       │
    │       ▼
    │   Role Check (requireRole)
    │       │
    │       ▼
    │   Procedure Execution
    │       │
    │       ▼
    │   Activity Log (withActivityLog)
    │
    └── Sign Out → Better Auth signOut()
```

## Middleware Stack (oRPC)

```
Request
  → BetterAuth (session verification)
    → requireUnitContext (resolve school_id + unit_id)
      → requireRole(['admin_tu', 'bendahara', ...])
        → withActivityLog({ action, entity, getEntityId })
          → Procedure Handler
            → Response
```

## File Structure (Current)

```
src/
├── components/ui/          # shadcn/ui components
├── features/               # Feature modules
│   ├── auth/               # Sign-in, sign-up, sign-out
│   ├── dashboard/          # Dashboard widgets
│   ├── teachers/           # Teacher management
│   ├── students/           # Student management
│   ├── classes/            # Class management
│   ├── spp/                # SPP payment system
│   ├── cashflow/           # Cashflow tracking
│   ├── events/             # School events/calendar
│   └── academic-years/     # Academic year management
├── lib/                    # Utilities
│   ├── auth-client.ts      # Better Auth client SDK
│   ├── auth.functions.ts   # Session helpers
│   ├── auth-routing.ts     # Route guard utilities
│   ├── auth.ts             # Better Auth server config (⚠️ should move to src/server/)
│   ├── decimal-setup.ts    # decimal.js configuration
│   └── formatters.ts       # Display formatters
├── routes/                 # TanStack Router (file-based)
│   ├── (auth)/             # Public auth routes (/sign-in, /sign-up)
│   └── _authenticated/     # Protected routes (with route guard)
├── server/
│   ├── db/
│   │   └── schema/         # Drizzle schemas (12 files, 18+ tables)
│   ├── routers/            # oRPC routers (scaffolding only)
│   │   ├── context.ts
│   │   ├── middlewares/
│   │   └── authorized.ts
│   └── middleware/          # NOT YET IMPLEMENTED
├── stores/                 # Zustand stores
└── types/                  # Shared TypeScript types
```
