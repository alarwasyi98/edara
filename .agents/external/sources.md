# External Sources — EDARA

> Layer 5: External memory sources, references, and documentation links.
> Links to specifications, libraries, and resources used by this project.

---

## Project Repository

- **GitHub:** https://github.com/alarwasyi98/edara
- **Active PR:** https://github.com/alarwasyi98/edara/pull/9 (`feat/auth` → `dev`)

## Core Documentation (Internal)

| Document | Path | Purpose |
|----------|------|---------|
| Technical Specification | `src/docs/technical-specification.md` | Full PRD — features, schemas, API, UI specs |
| Feature Stories | `src/docs/features-stories.md` | User stories with UX/UI considerations (Indonesian) |
| Better Auth Migration Spec | `src/docs/better-auth-migration-spec.md` | Canonical Clerk → Better Auth migration spec |
| Naming Dictionary | `docs/naming-dictionary.json` | Indonesian ↔ English identifier mapping |

## Library Documentation

| Library | Docs URL | Usage in EDARA |
|---------|----------|---------------|
| TanStack Start | https://tanstack.com/start | Meta-framework (Vite SPA mode) |
| TanStack Router | https://tanstack.com/router | File-based type-safe routing |
| TanStack Query | https://tanstack.com/query | Server state management |
| oRPC | https://orpc.unnoq.com | Type-safe RPC layer |
| Better Auth | https://www.better-auth.com | Authentication & session management |
| Drizzle ORM | https://orm.drizzle.team | PostgreSQL ORM |
| Neon | https://neon.tech/docs | Serverless PostgreSQL |
| pg-boss | https://github.com/timgit/pg-boss | PostgreSQL job queue |
| shadcn/ui | https://ui.shadcn.com | Component library (Radix primitives) |
| Tailwind CSS | https://tailwindcss.com/docs | Utility-first CSS (v4) |
| Zustand | https://zustand-demo.pmnd.rs | Client state management |
| decimal.js | https://mikemcl.github.io/decimal.js | Arbitrary-precision decimal arithmetic |
| react-hook-form | https://react-hook-form.com | Form state management |
| Zod | https://zod.dev | Schema validation |
| Vitest | https://vitest.dev | Testing framework |
| Lucide Icons | https://lucide.dev | Icon library |

## Design References

| Resource | URL | Usage |
|----------|-----|-------|
| Geist Font | https://vercel.com/font | Primary typeface (Geist + Geist Mono) |
| Radix Primitives | https://www.radix-ui.com/primitives | Accessible component primitives |

## Superseded Documents

> These documents are historical. Their content has been migrated to the memory system.

| Document | Path | Superseded By |
|----------|------|--------------|
| Earlier migration plan | `docs/superpowers/plans/2026-04-21-better-auth-migration.md` | `src/docs/better-auth-migration-spec.md` |
| Original migration design | `docs/superpowers/specs/2026-04-18-clerk-to-betterauth-migration-design.md` | `src/docs/better-auth-migration-spec.md` |
| Original implementation plan | `docs/superpowers/specs/2026-04-19-better-auth-implementation-plan.md` | `src/docs/better-auth-migration-spec.md` |
| Reconciliation audit | `src/docs/reconciliation-audit.md` | `.agents/memory/project.md` |
| Reconciliation log | `src/docs/reconciliation-log.md` | `.agents/memory/log.md` |
| Reconciliation plan | `src/docs/reconciliation-plan.md` | `docs/implementation-plan.md` |
| System instructions | `.agents/rules/system-instructions.md` | `.agents/memory/system.md` + `.agents/rules/coding-standards.md` |
