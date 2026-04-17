# AGENTS.md — EDARA Project

This file contains critical context for AI agents working on this codebase.

## Required Reading

Before any work, read these files:
- `.agents/rules/system-instructions.md` — Architecture rules and ADRs (mandatory)
- `src/docs/reconciliation-log.md` — Recent changes and current state

## Tech Stack

- **Framework**: TanStack Start (Vite SPA mode — NO SSR)
- **Routing**: TanStack Router (file-based, type-safe)
- **API**: oRPC (type-safe RPC)
- **Database**: Neon (PostgreSQL) + Drizzle ORM
- **Auth**: Clerk
- **Styling**: Tailwind CSS v4 + shadcn/ui (Radix)

## Critical Rules (from ADRs)

1. **Financial calculations**: NEVER use JS `+ - * /` for money. Use `decimal.js`:
   ```ts
   import Decimal from 'decimal.js'
   const total = new Decimal(amount).minus(discount).times(quantity)
   ```

2. **Append-only transactions**: `payment_transactions` has no UPDATE/DELETE. Corrections use reversal transactions.

3. **Multi-tenancy**: Every table MUST have `school_id`. RLS enforced at DB level via `set_config()`.

4. **Client-side only**: No `loader` functions. All data fetching via oRPC + TanStack Query.

5. **Activity logs**: Use `withActivityLog` middleware for mutations, not manual inserts.

## Development Commands

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

## Project Structure

```
src/
├── components/ui/     # shadcn/ui components
├── features/          # Feature modules (teachers, students, spp, cashflow, etc.)
├── lib/               # Utilities (formatters, validators, decimal-setup)
├── routes/            # TanStack Router routes
├── server/
│   ├── db/schema/     # Drizzle schemas
│   ├── routers/       # oRPC routers (NOT YET IMPLEMENTED)
│   └── middleware/    # Auth, RLS (NOT YET IMPLEMENTED)
├── stores/            # Zustand stores
└── docs/              # Documentation
```

## Current Status

- **Phase**: Section 2 (Database Schema) — Completed
- **Next Target**: Backend API Layer Implementation (oRPC routers)
- **Route files**: Use English paths (`/teachers`, `/students`, `/cashflow`)
- **Sidebar labels**: Indonesian (per Option B convention)

## Windows Development Environment

This project is primarily developed on a Windows machine at the office. Some UNIX commands may not work reliably. Use PowerShell 7 commands instead.

- Use `pwsh.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "your_command_here"` for shell operations
- Commands like `grep`, `glob`, `del`, `copy`, `move` may be broken — use PowerShell equivalents or the dedicated tools in this CLI
- If default tools fail, use Windows shell reliability commands

## Quirks & Gotchas

- **pnpm overrides**: `package.json` has `pnpm.overrides.rollup` to force version 4.60.0
- **ESLint warnings**: 8 warnings from `react-hooks/incompatible-library` for TanStack Table — safe to ignore
- **Build warning**: Large chunk (581KB) — future optimization target
- **No SSR**: Never generate `loader` functions; use `useQuery` / `useMutation` instead