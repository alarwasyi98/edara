# Coding Standards — EDARA

> Enforceable rules for all code contributions. AI agents and human developers must comply.

---

## TypeScript

- **Strict mode** enabled. No exceptions.
- **`any` is forbidden.** Use `unknown` if the type is truly unknown.
- **Explicit return types** on all public/exported functions.
- **Interface/type exports** go to `types/` folder or alongside Drizzle schemas.

## File & Folder Naming

| Context | Convention | Example |
|---------|-----------|---------|
| Files & folders | `kebab-case` | `student-form-drawer.tsx` |
| React components | `PascalCase` | `StudentFormDrawer` |
| Functions & hooks | `camelCase` | `useStudentData` |
| DB tables & columns | `snake_case` | `payment_transactions` |
| Zod schemas | `camelCase` + `Schema` | `teacherCreateSchema` |

## React & Component Patterns

- **Forms:** Always integrate with `react-hook-form` + Zod schema resolver.
- **Data fetching:** Use `useQuery` / `useMutation` from oRPC router. Never use raw `fetch`.
- **No SSR patterns:** Never use `loader` functions. Client-side only.
- **State management:** Zustand for client state. TanStack Query for server state.
- **UI components:** Tailwind CSS v4 + shadcn/ui (Radix primitives).

## Financial Code (CRITICAL)

```typescript
// ❌ FORBIDDEN — native JS arithmetic for money
const total = amount - discount;
const tax = price * 0.1;
const parsed = parseFloat(value);

// ✅ REQUIRED — decimal.js for all financial operations
import Decimal from 'decimal.js';
const total = new Decimal(amount).minus(discount);
const tax = new Decimal(price).times(new Decimal('0.1'));
```

- All money columns in PostgreSQL: `numeric(15, 2)`
- Values arrive as strings from DB — initialize with `new Decimal(value)`
- `formatRupiah` formatter must accept `Decimal` instances

## Database & ORM

- **Multi-tenancy:** Every tenant-scoped table MUST have `school_id`.
- **RLS:** Drizzle middleware calls `set_config('app.current_school', schoolId)` before queries.
- **Transactions:** Use `db.transaction(async (tx) => { ... })` — always use `tx` inside the callback, never `db`.
- **Append-only:** `payment_transactions` has no `updated_at`. No UPDATE/DELETE.
- **Activity logs:** Use `withActivityLog` middleware, never manual inserts.
- **UUID primary keys** for all tables.

## API (oRPC)

- **Validation:** Zod schemas on all inputs via `.input(schema)`.
- **Middleware stack:** `BetterAuth → requireUnitContext → requireRole → withActivityLog`
- **Error handling:** Throw `ORPCError` with appropriate codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`).
- **Pagination:** Standard response format with `{ data, total, page, pageSize }`.

## Routing

- **Route paths:** English (`/teachers`, `/students`, `/cashflow`)
- **Sidebar labels:** Indonesian (per naming convention Option B)
- **File-based routing** via TanStack Router
- **Route guards:** `/_authenticated` layout checks session, redirects to `/sign-in?redirect=...`

## Testing

- **Framework:** Vitest
- **File convention:** `*.test.ts` / `*.test.tsx` colocated or in `__tests__/` folders
- **Run:** `pnpm test` (watch) or `pnpm test:run` (CI)

## Import Organization

1. External packages (React, TanStack, etc.)
2. Internal aliases (`@/components`, `@/lib`, `@/server`)
3. Relative imports (same feature/module)
4. Type-only imports last
