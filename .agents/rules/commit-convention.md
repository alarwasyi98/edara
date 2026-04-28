# Commit Convention — EDARA

> Conventional Commits specification for all git commits in this repository.

---

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Usage |
|------|-------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `build` | Changes to build system or external dependencies |
| `ci` | Changes to CI configuration files and scripts |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

## Scopes

| Scope | Area |
|-------|------|
| `auth` | Authentication & authorization |
| `db` | Database schema, migrations, ORM |
| `api` | oRPC routers, middleware, procedures |
| `ui` | Frontend components, pages, layouts |
| `spp` | SPP payment module |
| `cashflow` | Cashflow module |
| `teachers` | Teachers module |
| `students` | Students module |
| `classes` | Classes module |
| `events` | Events/calendar module |
| `dashboard` | Dashboard module |
| `academic` | Academic year module |
| `tenant` | Multi-tenancy, unit management |
| `jobs` | pg-boss background jobs |
| `deps` | Dependency updates |
| `config` | Configuration files |
| `docs` | Documentation |

## Rules

1. **Subject line:** Max 72 characters, imperative mood ("add" not "added")
2. **Body:** Wrap at 72 characters. Explain *what* and *why*, not *how*.
3. **Breaking changes:** Add `BREAKING CHANGE:` footer or `!` after type/scope
4. **Reference issues:** Use `Closes #123` or `Refs #456` in footer

## Examples

```
feat(auth): integrate Better Auth client SDK

Replace mock Zustand auth store with Better Auth client calls.
Add route guards for authenticated routes.

Refs #9

---

fix(db): remove duplicate properties in users schema

userId field and userIdx index were defined twice, causing
TypeScript error TS1117 that blocked the build entirely.

---

docs: restructure project documentation into memory system

Migrate documentation from src/docs/ to .agents/memory/ layered
architecture. Consolidate ADRs, session logs, and project state.

---

refactor(spp): replace Number arithmetic with decimal.js

BREAKING CHANGE: All financial calculation functions now accept
and return Decimal instances instead of numbers.
```
