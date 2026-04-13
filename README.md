# EDARA

**EDARA** (أدارة — "Administrasi") is a multi-tenant SaaS platform for Indonesian Islamic school foundations (yayasan) managing 2–10 educational units (MI, MTs, MA, SD, SMP, SMA, Pesantren). The system replaces Excel-based workflows with a structured, role-based platform covering student lifecycle management, teacher records, SPP (tuition) billing with flexible discount schemes, cash flow tracking, and activity calendars.

![banner-image](public/images/madrasah-connect.webp)

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|--------|
| **Frontend** | [React](https://react.dev/) ^19.x | UI framework |
| **Routing** | [TanStack Router](https://tanstack.com/router) ^1.x | File-based routing, type-safe |
| **State (Server)** | [TanStack Query](https://tanstack.com/query) ^5.x | Server state, caching, mutations |
| **State (UI)** | [Zustand](https://zustand-demo.pmnd.rs/) ^5.x | UI state (active unit, sidebar, theme) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) ^4.x | Utility-first CSS, design tokens |
| **Components** | [shadcn/ui](https://ui.shadcn.com/) (Radix UI) | Headless accessible components |
| **Forms** | [React Hook Form](https://www.react-hook-form.com/) ^7.x + [Zod](https://zod.dev/) ^4.x | Schema-driven validation |
| **Charts** | [Recharts](https://recharts.org/) ^2.x | Cashflow and SPP trend charts |
| **Calendar** | [react-big-calendar](https://github.com/vazco/react-big-calendar) | Calendar view for events |
| **Backend** | [TanStack Start](https://tanstack.com/start) | Full-stack framework (SPA Phase 1, SSR Phase 2) |
| **API** | [oRPC](https://orc.js.org/) | Type-safe RPC layer |
| **Auth** | [Clerk](https://clerk.com/) ^5.x | Auth JWT validation, user management |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe SQL query builder |
| **Jobs** | [pg-boss](https://github.com/tgriesser/pg-boss) | PostgreSQL-native job queue |
| **Database** | [Neon](https://neon.tech/) (PostgreSQL) | Serverless PostgreSQL |
| **Package Manager** | [pnpm](https://pnpm.io/) | Fast, disk space efficient |

---

## Project Architecture

EDARA uses **TanStack Start** as a unified full-stack framework with the following key patterns:

### Multi-Tenancy (Shared Schema)
Every database table carries `school_id` (tenant) and optionally `unit_id` (sub-tenant). PostgreSQL Row Level Security (RLS) policies enforce isolation at the database layer, independent from application code.

### Computed State over Stored Status
SPP payment status (paid/partial/unpaid) is never stored — derived via SQL aggregation from `payment_transactions` at query time. This ensures consistency and enables reversal mechanisms without data corruption.

### Append-Only Financial Records
`payment_transactions` has no `updated_at` column and no UPDATE/DELETE permissions at the application layer. Corrections use reversal transactions referencing the original transaction ID.

> [!INFO]
> For full technical specification details, see: [Technical Specification](src/docs/technical-specification.md)

---

## Getting Started

### Prerequisites

- Node.js ^20.x
- pnpm ^9.x
- PostgreSQL (Neon) account
- Clerk account

### Installation

```bash
# Clone the repository
git clone https://github.com/alarwasyi98/edara.git
cd edara

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Edit `.env` and add your credentials:

```env
# Database (Neon)
DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"

# Clerk Authentication
CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_JWT_KEY="..."
```

### Running the Project

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

---

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/        # App shell, sidebar, header
│   │   ├── ui/           # shadcn/ui base components
│   │   └── data-table/    # Data table components
│   ├── features/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── dashboard/    # Dashboard & analytics
│   │   ├── teachers/    # Teacher management
│   │   ├── students/    # Student management
│   │   ├── classes/     # Class management
│   │   ├── spp/        # SPP billing
│   │   ├── cashflow/    # Cash flow tracking
│   │   └── events/     # Calendar events
│   ├── lib/             # Shared utilities
│   │   ├── validators/  # Zod schemas
│   │   ├── constants/   # App constants
│   │   ├── utils/      # Helper functions
│   │   └── formatters/  # Formatters (currency, dates)
│   ├── routes/           # TanStack Router routes
│   ├── server/           # Backend
│   │   ├── db/         # Drizzle ORM & schema
│   │   ├── routers/    # oRPC routers
│   │   ├── middleware/# Auth, RLS, RBAC
│   │   └── jobs/       # pg-boss workers
│   ├── stores/           # Zustand stores
│   └── docs/            # Documentation
│       ├── technical-specification.md
│       ├── reconciliation-plan.md
│       └── reconciliation-log.md
├── .github/              # GitHub configs
├── package.json
└── README.md
```

---

## Key Features

| Feature | Description |
|---------|-----------|
| **Multi-Tenant Management** | Register and manage foundations with multiple educational units |
| **Unit Switching** | Role-based context switching between units |
| **Academic Year** | Manage academic years with exclusive activation |
| **Teacher Management** | CRUD, soft-delete, bulk import from Excel |
| **Student Lifecycle** | Registration, enrollment, status transitions (promote, transfer, graduate) |
| **Class Management** | Class CRUD, capacity tracking, mass promotion |
| **SPP Billing** | Categories, per-class rates, discount schemes, auto-generation |
| **Payment Recording** | Append-only payments with reversal support |
| **Payment Matrix** | Dynamic payment status computed from transactions |
| **Cashflow** | Income/expense tracking with auto-linked SPP payments |
| **Events Calendar** | Table and calendar views for school activities |
| **Export Reports** | Excel/PDF generation via background jobs |

For feature specifications, see: [Technical Specification - Feature Specifications](src/docs/technical-specification.md#3-feature-specifications)

---

## Development Workflow

### Current Sprint

The project follows a staged reconciliation plan from Mock/Vite SPA toward TanStack Start + oRPC + Drizzle ORM.

- **Current Phase**: Section 1 (Stabilization & Basic Infrastructure)
- **Progress**: Step 3 of 34 completed (8%)
- **Next Target**: Step 4 (Core Tenant Schema Definition)

For full plan, see: [Reconciliation Plan](src/docs/reconciliation-plan.md)

### Branch Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- Feature branches: `feature/feature-name`

---

## Coding Standards

- **Type Safety**: Full TypeScript with strict mode
- **Validation**: Zod schemas shared between client and server
- **Financial Precision**: decimal.js for all monetary calculations (ADR-07)
- **API Contracts**: oRPC for end-to-end type safety
- **Styling**: Tailwind CSS v4 with design tokens
- **Components**: shadcn/ui (Radix UI primitives)

> **Before submitting changes**, run:
> ```bash
> pnpm lint && pnpm format && pnpm typecheck
> ```

---

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run
```

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](.github/CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`feature/your-feature`)
3. Make your changes
4. Run lint, format, and typecheck
5. Submit a pull request

---

## License

This project is licensed under the [ISC License](LICENSE).

---

## Documentation Links

- [Technical Specification](src/docs/technical-specification.md) — Full system spec
- [Implementation/Reconciliation Plan](src/docs/reconciliation-plan.md) — Step-by-step implementation
- [Current Sprint](src/docs/reconciliation-log.md) — Progress tracking