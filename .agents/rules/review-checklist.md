# Review Checklist — EDARA

> Pre-merge verification checklist for all code changes.
> Every item must pass before a PR is approved.

---

## CI Pipeline (Mandatory)

- [ ] `pnpm format:check` — Prettier formatting passes
- [ ] `pnpm typecheck` — TypeScript strict mode, zero errors
- [ ] `pnpm lint --max-warnings 10` — ESLint passes (8 warnings baseline tolerated)
- [ ] `pnpm build` — Production build succeeds
- [ ] `pnpm test:run` — All Vitest tests pass

## Architecture Compliance

- [ ] No SSR patterns (`loader`, `getServerSideProps`, `createServerFn`)
- [ ] No `any` types — use `unknown` if needed
- [ ] Multi-tenancy: new tables have `school_id` column
- [ ] RLS: queries go through middleware with `set_config()`
- [ ] Activity logs: mutations use `withActivityLog`, not manual inserts

## Financial Code (if applicable)

- [ ] No native JS arithmetic (`+`, `-`, `*`, `/`) on money values
- [ ] All financial calculations use `decimal.js`
- [ ] Money columns use `numeric(15, 2)` in schema
- [ ] Zod validators produce decimal-safe string outputs

## Database Changes (if applicable)

- [ ] New tables have `school_id` (and `unit_id` if unit-scoped)
- [ ] UUID primary keys
- [ ] `snake_case` for table and column names
- [ ] `payment_transactions` remains append-only (no `updated_at`)
- [ ] Drizzle migration generated (`pnpm db:generate`)
- [ ] Migration SQL reviewed for correctness

## Auth & Security (if applicable)

- [ ] No Clerk references (fully migrated to Better Auth)
- [ ] Protected routes use `requireRole` middleware
- [ ] Sensitive operations have role checks
- [ ] No server-side code imported in client bundle

## UI & Components (if applicable)

- [ ] Forms use `react-hook-form` + Zod resolver
- [ ] Data fetching via `useQuery` / `useMutation` from oRPC
- [ ] Tailwind CSS v4 + shadcn/ui components
- [ ] Route paths in English, sidebar labels in Indonesian
- [ ] Responsive design considered

## Code Quality

- [ ] Explicit return types on exported functions
- [ ] `kebab-case` file names
- [ ] `PascalCase` component names
- [ ] No hardcoded secrets or credentials
- [ ] Commit message follows conventional commits format

## Documentation

- [ ] Session log updated in `.agents/memory/log.md` (if significant changes)
- [ ] ADR recorded in `.agents/memory/decisions.md` (if architectural decision made)
- [ ] Project state updated in `.agents/memory/project.md` (if feature status changed)
