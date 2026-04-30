# External Sources — EDARA

> Layer 5: External memory sources, references, and documentation links.
> Links to specifications, libraries, and resources used by this project.

---

## Project Repository

- **GitHub:** https://github.com/alarwasyi98/edara

## Core Documentation (Internal)

| Document                   | Path                          | Purpose                                             |
| -------------------------- | ----------------------------- | --------------------------------------------------- |
| Product Requirements (PRD) | `docs/prd.md`                 | Features, schemas, API, security, infrastructure    |
| Feature Stories            | `docs/features-stories.md`    | User stories with UX/UI considerations (Indonesian) |
| Implementation Plan        | `docs/implementation-plan.md` | Step-wise task plan with progress tracking          |
| Naming Dictionary          | `docs/naming-dictionary.json` | Indonesian ↔ English identifier mapping             |

## Library Documentation

| Library         | Docs URL                             | Usage in EDARA                         |
| --------------- | ------------------------------------ | -------------------------------------- |
| TanStack Start  | https://tanstack.com/start           | Meta-framework (Vite SPA mode)         |
| TanStack Router | https://tanstack.com/router          | File-based type-safe routing           |
| TanStack Query  | https://tanstack.com/query           | Server state management                |
| oRPC            | https://orpc.unnoq.com               | Type-safe RPC layer                    |
| Better Auth     | https://www.better-auth.com          | Authentication & session management    |
| Drizzle ORM     | https://orm.drizzle.team             | PostgreSQL ORM                         |
| Neon            | https://neon.tech/docs               | Serverless PostgreSQL                  |
| pg-boss         | https://github.com/timgit/pg-boss    | PostgreSQL job queue                   |
| shadcn/ui       | https://ui.shadcn.com                | Component library (Radix primitives)   |
| Tailwind CSS    | https://tailwindcss.com/docs         | Utility-first CSS (v4)                 |
| Zustand         | https://zustand-demo.pmnd.rs         | Client state management                |
| decimal.js      | https://mikemcl.github.io/decimal.js | Arbitrary-precision decimal arithmetic |
| react-hook-form | https://react-hook-form.com          | Form state management                  |
| Zod             | https://zod.dev                      | Schema validation                      |
| Vitest          | https://vitest.dev                   | Testing framework                      |
| Lucide Icons    | https://lucide.dev                   | Icon library                           |

## Design References

| Resource         | URL                                 | Usage                                 |
| ---------------- | ----------------------------------- | ------------------------------------- |
| Geist Font       | https://vercel.com/font             | Primary typeface (Geist + Geist Mono) |
| Radix Primitives | https://www.radix-ui.com/primitives | Accessible component primitives       |

## Superseded Documents

> These documents are historical. Their content has been migrated to the memory system.

| Document                     | Path        | Superseded By                                                    |
| ---------------------------- | ----------- | ---------------------------------------------------------------- |
| Earlier migration plan       | _(deleted)_ | `docs/better-auth-migration-spec.md`                             |
| Original migration design    | _(deleted)_ | `docs/better-auth-migration-spec.md`                             |
| Original implementation plan | _(deleted)_ | `docs/better-auth-migration-spec.md`                             |
| Reconciliation audit         | _(deleted)_ | `.agents/memory/project.md`                                      |
| Reconciliation log           | _(deleted)_ | `.agents/memory/log.md`                                          |
| Reconciliation plan          | _(deleted)_ | `docs/implementation-plan.md`                                    |
| Technical specification      | _(deleted)_ | `docs/prd.md`                                                    |
| System instructions          | _(deleted)_ | `.agents/memory/system.md` + `.agents/rules/coding-standards.md` |
