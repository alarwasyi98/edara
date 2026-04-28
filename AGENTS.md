# AGENTS.md — EDARA Universal Activation Contract

> This file is the entry point for ALL AI agents working on this codebase.
> Read this file first, then follow the memory system for deeper context.

---

## Memory System

This project uses a layered memory architecture. Read files in this order:

| Priority | File | Purpose |
|----------|------|---------|
| 🔴 Must | `.agents/memory/system.md` | Tech stack, constraints, naming conventions |
| 🔴 Must | `.agents/memory/project.md` | Current state, feature inventory, known gotchas |
| 🟡 Before coding | `.agents/memory/decisions.md` | ADRs — architectural decisions you must not violate |
| 🟡 Before coding | `.agents/rules/coding-standards.md` | Code style, patterns, forbidden practices |
| 🟢 Context | `.agents/memory/log.md` | Session history — what happened recently |
| 🟢 Context | `.agents/memory/graph.md` | Module dependencies, table relationships |
| 🔵 Reference | `.agents/external/sources.md` | External docs, library links |
| 🔵 Reference | `.agents/rules/commit-convention.md` | Commit message format |
| 🔵 Reference | `.agents/rules/review-checklist.md` | Pre-merge verification |

## Critical Rules (Quick Reference)

1. **No SSR** — Vite SPA only. No `loader`, no `getServerSideProps`, no `createServerFn`.
2. **decimal.js for money** — NEVER use JS `+ - * /` for financial calculations.
3. **Append-only transactions** — `payment_transactions` has no UPDATE/DELETE. Use reversals.
4. **Multi-tenancy** — Every table MUST have `school_id`. RLS enforced at DB level.
5. **Activity logs** — Use `withActivityLog` middleware, not manual inserts.
6. **Better Auth** — NOT Clerk. Auth provider is Better Auth. See decisions.md C7.
7. **TypeScript strict** — No `any`. Explicit return types on exports.

## Tech Stack (Summary)

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TanStack Start (SPA), TanStack Router/Query, Zustand |
| Styling | Tailwind CSS v4, shadcn/ui |
| API | oRPC |
| Auth | Better Auth (identity/session) + EDARA RBAC (`user_school_assignments`) |
| Database | Neon PostgreSQL, Drizzle ORM, pg-boss |
| Financial | decimal.js (mandatory) |

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

## CI Pipeline

Run in order: `format:check` → `typecheck` → `lint --max-warnings 10` → `build`

## Current Status

- **Phase:** Phase 1 — Migration from Mock to Real Backend
- **Progress:** Steps 1–7 done, Step 8 in progress (~40%)
- **Next:** Scaffold backend auth server, regenerate Drizzle migrations

## Documentation Map

| Document | Path |
|----------|------|
| Product Requirements | `docs/PRD.md` |
| Implementation Plan | `docs/implementation-plan.md` |
| Technical Specification | `src/docs/technical-specification.md` |
| Feature Stories | `src/docs/features-stories.md` |
| Better Auth Migration | `src/docs/better-auth-migration-spec.md` |
| Naming Dictionary | `docs/naming-dictionary.json` |

## After Your Session

1. Update `.agents/memory/log.md` — append a new session entry at the top
2. Update `.agents/memory/project.md` — if feature status changed
3. Record new ADRs in `.agents/memory/decisions.md` — if architectural decisions were made
4. Follow commit convention in `.agents/rules/commit-convention.md`

## Environment Notes

- **OS:** Windows (use PowerShell, not UNIX commands)
- **Package manager:** pnpm only
- **Quirks:** rollup 4.60.0 override, 8 ESLint warnings baseline, 581KB chunk warning
