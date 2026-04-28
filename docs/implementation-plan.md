# Implementation Plan — EDARA

> Step-wise task plan for Phase 1 MVP. Extracted from `src/docs/reconciliation-plan.md`.
> Auth references updated from Clerk to Better Auth per migration decision (C7).
> Progress status reflects current state as of Session 14 (2026-04-26).

---

## Overview

- **Total:** 10 sections, 27 steps
- **Completed:** Steps 1–7 (Sections 1–2)
- **In Progress:** Step 8 (~40% — Better Auth integration)
- **Remaining:** Steps 9–27

---

## [Section 1] Stabilisasi & Infrastruktur Dasar ✅

### Step 1: Pembersihan Fitur Out-of-Scope & Rute ✅
- **Task:** Menghapus modul `ppdb` dan `alumni` yang di luar Phase 1. Membersihkan navigasi.
- **Files:** `src/features/ppdb/*`, `src/features/alumni/*`, route files, sidebar links
- **Dependencies:** None

### Step 2: Instalasi Dependensi Backend & Testing ✅
- **Task:** Menambahkan dependensi wajib: Drizzle ORM, oRPC, Better Auth, decimal.js, Vitest.
- **Files:** `package.json`, `vitest.config.ts`, `src/lib/decimal-setup.ts`
- **Dependencies:** Step 1

### Step 3: Konfigurasi Database & Drizzle ORM ✅
- **Task:** Menghubungkan ke Neon PostgreSQL, mengatur Drizzle ORM.
- **Files:** `.env`, `drizzle.config.ts`, `src/server/db/index.ts`
- **Dependencies:** Step 2

---

## [Section 2] Implementasi Skema Database & RLS ✅

### Step 4: Definisi Skema Inti (Tenant, Unit, Tahun Ajaran) ✅
- **Task:** Tabel `schools`, `school_units`, `academic_years`, `user_school_assignments`.
- **Files:** `src/server/db/schema/schools.ts`, `users.ts`, `academic-years.ts`, `index.ts`
- **Dependencies:** Step 3

### Step 5: Definisi Skema Operasional (Guru, Siswa, Kelas, Enrollment) ✅
- **Task:** Tabel `teachers`, `students`, `classes`, `enrollments`, `enrollment_status_history`.
- **Files:** `src/server/db/schema/teachers.ts`, `students.ts`, `classes.ts`, `enrollments.ts`
- **Dependencies:** Step 4
- **Notes:** ADR-06 (`mataPelajaran` JSON array), B11 (siswa tidak dihapus permanen)

### Step 6: Definisi Skema Finansial & Log ✅
- **Task:** Tabel SPP, cashflow, events, activity logs. ADR-07 (numeric precision), ADR-04 (append-only).
- **Files:** `src/server/db/schema/spp.ts`, `cashflow.ts`, `logs.ts`, `events.ts`
- **Dependencies:** Step 5

### Step 7: Penerapan Row Level Security (RLS) ✅
- **Task:** Migrasi SQL raw untuk RLS policies (tenant isolation, unit isolation).
- **Files:** `src/server/db/migrations/0000_rls_setup.sql`
- **Dependencies:** Step 6

---

## [Section 3] Middleware Keamanan, Autentikasi & API Dasar 🔄

### Step 8: Integrasi Better Auth & Route Guards 🔄 (~40%)
- **Task:** Integrasi Better Auth SDK, route guards, session management.
- **Files:**
  - `src/lib/auth-client.ts` — Better Auth client SDK ✅
  - `src/lib/auth.functions.ts` — Session helpers (getSession, requireSession) ✅
  - `src/lib/auth-routing.ts` — Route guard utilities ✅
  - `src/routes/_authenticated/route.tsx` — Route guard redirect ✅
  - `src/routes/(auth)/sign-in.tsx`, `sign-up.tsx` — Auth pages ✅
- **Remaining:**
  - Scaffold backend auth server (mount `betterAuth()` instance)
  - Move `src/lib/auth.ts` to `src/server/auth/`
  - Add FK `userId` → `user.id` on `user_school_assignments`
  - Regenerate Drizzle migrations (nuke `drizzle/` and regenerate)
  - Seed test user (`scripts/seed-auth.ts`)
  - Add role checks to admin router
- **Dependencies:** Step 2

### Step 9: Middleware Server untuk Konteks Autentikasi & RLS ❌
- **Task:** oRPC middleware: Better Auth session verification, RLS context injection, RBAC guard.
- **Files:**
  - `src/server/middleware/auth.ts` — Better Auth session verification
  - `src/server/middleware/rls.ts` — `set_config('app.current_school', schoolId)` before queries
  - `src/server/middleware/rbac.ts` — `requireRole(['bendahara', 'super_admin'])` guard
- **Dependencies:** Step 7, Step 8

### Step 10: Middleware Pencatatan Log Aktivitas Terpusat ❌
- **Task:** Implementasi ADR-05. `withActivityLog` middleware untuk oRPC procedures.
- **Files:** `src/server/middleware/activity-log.ts`
- **Dependencies:** Step 6, Step 9

---

## [Section 4] Inisialisasi API Router & Job Workers ❌

### Step 11: Setup oRPC Root Router & TanStack Start (Mode SPA)
- **Task:** Konfigurasi `appRouter`, oRPC client, QueryClientProvider.
- **Files:** `src/server/routers/index.ts`, `src/lib/orpc.ts`, `src/app/client.tsx`, `server.ts`
- **Dependencies:** Step 9, Step 10

### Step 12: Konfigurasi Background Job pg-boss (Colocated)
- **Task:** Bootstrap pg-boss instance, `startJobWorkers()`.
- **Files:** `src/server/jobs/index.ts`, `server.ts`
- **Dependencies:** Step 11

---

## [Section 5] Migrasi Domain: Konteks & Dashboard ❌

### Step 13: Migrasi Unit Context & Router User
- **Task:** Sinkronisasi role/assignment, ganti mock unit switching dengan Better Auth session-based context.
- **Files:** `src/stores/tenant-store.ts`, `src/server/routers/users.ts`, `src/features/auth/components/unit-selector-modal.tsx`
- **Dependencies:** Step 8, Step 11

### Step 14: Restrukturisasi API Dashboard Real-Time
- **Task:** Ganti mock data dengan query agregasi database.
- **Files:** `src/server/routers/dashboard.ts`, `src/features/dashboard/hooks/use-dashboard-data.ts`
- **Dependencies:** Step 11, Step 13

---

## [Section 6] Migrasi Domain: Akademik Inti ❌

### Step 15: Konversi Tahun Pelajaran & Logika Aktivasi
- **Task:** CRUD endpoints + `activate` transaction (deactivate old, activate new).
- **Files:** `src/server/routers/academic-years.ts`, `src/features/academic-years/hooks/`
- **Dependencies:** Step 11

### Step 16: Migrasi Kelas & Prosedur Kenaikan Massal
- **Task:** CRUD Kelas + `promoteMassal` (batch UPDATE/INSERT enrollments in transaction).
- **Files:** `src/server/routers/classes.ts`, `src/features/classes/components/promote-class-dialog.tsx`
- **Dependencies:** Step 15
- **Critical:** Use `tx` inside `db.transaction()`, not `db`. Use `withActivityLog`.

---

## [Section 7] Migrasi Domain: Guru ❌

### Step 17: Operasional Utama CRUD Guru
- **Task:** List (paginated), create, update, deactivate (soft-delete).
- **Files:** `src/server/routers/teachers.ts`, `src/features/teachers/hooks/`, `src/features/teachers/components/teacher-form-drawer.tsx`
- **Dependencies:** Step 11
- **Notes:** ADR-06 — JSON array for subjects, no junction table.

### Step 18: Bulk Import Guru (pg-boss)
- **Task:** Excel import via pg-boss job worker.
- **Files:** `src/server/jobs/bulk-import-teachers.ts`, `src/server/routers/teachers.ts` (importExecute), `src/features/teachers/components/teacher-import-dialog.tsx`
- **Dependencies:** Step 12, Step 17

---

## [Section 8] Migrasi Domain: Siswa ❌

### Step 19: Pendaftaran Siswa Baru
- **Task:** Dual insert (students + enrollments) in single transaction.
- **Files:** `src/server/routers/students.ts`, `src/features/students/hooks/`, `src/features/students/components/student-form-drawer.tsx`
- **Dependencies:** Step 16
- **Critical:** Use `db.transaction()` with `tx` for dual insert.

### Step 20: Alih Status, Kelulusan, & Mutasi Siswa
- **Task:** Status transitions with `enrollment_status_history` audit trail.
- **Files:** `src/server/routers/students.ts` (changeStatus), `src/features/students/components/status-change-dialogs/`
- **Dependencies:** Step 19

---

## [Section 9] Migrasi Domain: SPP & Keuangan Kritis ❌

> **ADR-07 applies to ALL steps in this section.** decimal.js mandatory.

### Step 21: Tooling Keuangan & Restrukturisasi Formatter
- **Task:** decimal.js integration, Zod validators for financial inputs, `formatRupiah` update.
- **Files:** `src/lib/validators/finance.ts`, `src/lib/formatters.ts`
- **Dependencies:** Step 2

### Step 22: Pengaturan Tagihan & Penguncian Diskon SPP
- **Task:** Category CRUD, rates matrix, discount schemes, bill auto-generation (pg-boss).
- **Files:** `src/server/routers/spp.ts`, `src/server/jobs/generate-bills.ts`, `src/features/spp/components/config/`
- **Dependencies:** Step 21

### Step 23: Pencatatan Pembayaran & Reversal (Inti Operasional)
- **Task:** Append-only `recordPayment` + `reversePayment` + cashflow auto-link.
- **Files:** `src/server/routers/spp.ts`, `src/features/spp/components/record-payment-dialog.tsx`, `reversal-dialog.tsx`, `transactions-table.tsx`
- **Dependencies:** Step 22
- **Critical:** ADR-04 (append-only), use `tx` for atomic reversal + activity log.

### Step 24: Migrasi Matriks Tunggakan Secara Dinamis
- **Task:** Server-computed payment matrix (ADR-03). SQL aggregation for status.
- **Files:** `src/server/routers/spp.ts` (getPaymentMatrix, getArrears), `src/features/spp/components/payment-matrix.tsx`
- **Dependencies:** Step 23

### Step 25: Integrasi Cashflow & Auto-Link Pembayaran
- **Task:** Cashflow CRUD + auto-link from SPP `recordPayment` in same transaction.
- **Files:** `src/server/routers/cashflow.ts`, `src/server/routers/spp.ts` (update), `src/features/cashflow/`
- **Dependencies:** Step 24
- **Critical:** Auto-linked entries (with `sppPaymentId`) cannot be edited/deleted.

---

## [Section 10] Migrasi Domain: Kalender & Modul Ekspor ❌

### Step 26: Migrasi Kalender & Komputasi Event Card
- **Task:** Events CRUD + summary stats aggregation.
- **Files:** `src/server/routers/events.ts`, `src/features/events/components/`
- **Dependencies:** Step 11

### Step 27: Infrastruktur Pengekspor Laporan (pg-boss Generator)
- **Task:** Excel/PDF report generation via pg-boss job worker.
- **Files:** `src/server/jobs/generate-excel-report.ts`, `src/server/routers/reports.ts`, `src/features/shared/components/export-button.tsx`
- **Dependencies:** Step 12, Step 24, Step 25
