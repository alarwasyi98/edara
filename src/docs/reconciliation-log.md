---
name: reconciliation-log
description: Reconciliation Log for EDARA
status: draft
modified: 2026-04-13
version: 0.0.4
---

# EDARA Project Reconciliation Log

Dokumen ini melacak "Current State" dan histori perubahan selama proses rekonsiliasi proyek dari state legacy/mock menuju Phase 1 MVP.

> [!IMPORTANT]
> **Project**: EDARA
> **Status**: Draft
> **Version**: 0.0.4
> **Last Updated**: 2026-04-13
> **Next Target**: Step 8 (Section 3: Integrasi Auth Clerk)

## 🏁 Current Sprint Summary
- **Project**: EDARA
- **Phase**: Section 2 (Implementasi Skema Database & RLS) — ✅ **COMPLETED**
- **Status Progress**: 7/34 Steps Completed (20%)
- **Last Updated**: 2026-04-13
- **Next Target**: Step 8 (Section 3: Integrasi Auth Clerk)
- **Plan Reference**: [Reconciliation Plan](src/docs/reconciliation-plan.md)
- **Active Branch**: `recon (deleted/merged)`

---

## 📅 Session: 2026-04-13 — Sesi 4 (CI Remediation)

### 📝 Status Saat Ini
Memperbaiki error linting pada CI job terkait duplikasi import.

### 🛠️ File yang Diubah
  - `src/server/db/schema/spp.ts`: Konsolidasi `AnyPgColumn` ke dalam destructured import block.

---

## 📅 Session: 2026-04-13 — Sesi 5 (Database Schema Optimization)

### 📝 Status Saat Ini
Melakukan optimasi skema database berdasarkan hasil audit, menambahkan indeks wajib untuk RLS (tenant isolation), menargetkan optimasi agregasi finansial, serta memperbaiki tipe data yang kurang sesuai. History migration Drizzle direset untuk membuat _clean professional baseline_.

### 🛠️ File yang Terpengaruh, Diubah, Dihapus, dan Ditambah
- **Diubah** `src/server/db/schema/teachers.ts`: Migrasi `mataPelajaran` (ADR-06) dari `text` menjadi `jsonb` untuk performa query array.
- **Diubah** `src/server/db/schema/spp.ts`, `cashflow.ts`, `events.ts`, `logs.ts`, `classes.ts`, `enrollments.ts`, `users.ts`: Menambahkan B-Tree dan composite indeks pada `school_id`, `unit_id`, serta kolom relasional lainnya demi performa *Row Level Security* (mencegah *Sequential Scan*).
- **Dihapus** `drizzle/` (keseluruhan folder terhapus sementara): Menghapus _dirty history_ beserta snapshot sebelumnya.
- **Ditambah** `drizzle/0000_init_tenant_operational_schema.sql`: Dibuat ulang (regenerate) menjadi baseline awal skema database secara keseluruhan.
- **Ditambah** `drizzle/0001_rls_and_constraints.sql`: Dibuat dari mode `--custom` yang melacak policy RLS dan constrain `UNIQUE` menggunakan SQL murni dari file `.sql` lama.

### 📌 Catatan untuk Sesi Selanjutnya
- **Prioritas**: Maju ke Phase 1 - Section 3 (Integrasi Auth Clerk) seperti yang direncanakan.
- **Review**: Pastikan branch `perf/database` dapat di-merge atau di-Pull Request ke main branch kapan pun dibutuhkan.

---

## 📅 Session: 2026-04-13 — Sesi 3 (Section 2 Execution)

### 📝 Status Saat Ini
Section 2 selesai dieksekusi. 18 tabel didefinisikan dalam 11 file schema, 2 file migrasi SQL di-generate (schema + custom RLS).

### 🛠️ File yang Dibuat
| File                                     | Tabel                                                                                                              | ADR/Rules                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `src/server/db/schema/schools.ts`        | `schools`, `school_units`                                                                                          | ADR-02                                     |
| `src/server/db/schema/users.ts`          | `user_school_assignments` + enum                                                                                   | B10, C7                                    |
| `src/server/db/schema/academic-years.ts` | `academic_years`                                                                                                   | B1 (partial index in SQL)                  |
| `src/server/db/schema/teachers.ts`       | `teachers`                                                                                                         | ADR-06, B11                                |
| `src/server/db/schema/students.ts`       | `students`                                                                                                         | B4, B11                                    |
| `src/server/db/schema/classes.ts`        | `classes`                                                                                                          | —                                          |
| `src/server/db/schema/enrollments.ts`    | `enrollments`, `enrollment_status_history` + enum                                                                  | B5, C6                                     |
| `src/server/db/schema/spp.ts`            | `payment_categories`, `class_payment_rates`, `discount_schemes`, `payment_bills`, `payment_transactions` + 2 enums | ADR-03, ADR-04, ADR-07, B2, B3, B6, C4, C5 |
| `src/server/db/schema/cashflow.ts`       | `cashflow_categories`, `cashflow_transactions`                                                                     | ADR-07, B12                                |
| `src/server/db/schema/events.ts`         | `school_events` + 2 enums                                                                                          | B13                                        |
| `src/server/db/schema/logs.ts`           | `activity_logs`                                                                                                    | C1, C8                                     |
| `src/server/db/schema/index.ts`          | (barrel file)                                                                                                      | —                                          |
| `drizzle/0000_absurd_wind_dancer.sql`    | (auto-generated schema migration)                                                                                  | —                                          |
| `drizzle/0001_rls-and-constraints.sql`   | (custom RLS + partial index + immutability)                                                                        | ADR-02, ADR-04, B1                         |

### ⚖️ Keputusan Teknis (Log Keputusan)
| Keputusan                                     | Justifikasi                                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **enrollment_status_history tanpa school_id** | Tabel ini di-RLS via subquery pada enrollment parent. Tidak perlu duplikasi school_id.                |
| **REVOKE UPDATE/DELETE di-comment**           | Part E (ADR-04 enforcement) memerlukan konfirmasi nama role DB. Di-comment sampai setup role selesai. |
| **check() untuk billing_month**               | Drizzle mendukung `check()` constraint. Regex `^\d{4}-(0[1-9]                                         | 1[0-2])$` memvalidasi format YYYY-MM di level DB. |

### 🚧 Hambatan & Mitigasi
- **Tidak ada hambatan** — semua typecheck, test, dan migration generation berhasil tanpa error.

### 📌 Catatan untuk Sesi Selanjutnya
- **Next**: Section 3 (Integrasi Auth & API) dimulai dari Step 8.
- **Pending**: `pnpm db:migrate` hanya bisa dijalankan jika `DATABASE_URL` mengarah ke Neon instance yang valid.
- **Pending**: Part E (REVOKE) di `0001_rls-and-constraints.sql` perlu uncomment setelah role DB dikonfirmasi.
- **Merge**: Pertimbangkan merge `recon` → `dev` setelah Section 2 selesai.

---

## 📅 Session: 2026-04-12 — Sesi 2 (Section 2 Planning & Review)

### 📝 Status Saat Ini
Rencana implementasi Section 2 (Steps 4–7) sudah dibuat dan **di-review oleh user**. Tiga keputusan arsitektural telah diambil. Rencana siap dieksekusi setelah approval final.

### 🛠️ File yang Diubah/Dibuat
- **Created**: `src/docs/reconciliation-log.md` (file ini)
- **Git**: Branch `recon` di-merge ke `dev` (fast-forward, 25 files changed)

### ⚖️ Keputusan Teknis (Log Keputusan)
| Keputusan                              | Justifikasi                                                                                                                                                                                  |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Merge ke dev sebelum Section 2**     | Membuat safe baseline. Jika schema DB bermasalah di Section 2, ada titik balik yang bersih.                                                                                                  |
| **Partial Unique Index via Raw SQL** ✅ | DITERIMA. Didokumentasikan sebagai "manual SQL escape hatch". Drizzle tidak mendukung `CREATE UNIQUE INDEX ... WHERE ...`. Ditulis di custom migration (Step 7).                             |
| **RLS via Tracked Migration** ❌→✅      | DITOLAK push manual via Neon Console. Menggunakan `drizzle-kit generate --custom` → `pnpm db:migrate`. RLS policies adalah migration file yang terlacak di VCS.                              |
| **Transaction-Scoped RLS Context** ✅   | DITERIMA (ketat). `set_config()` hanya dipanggil di dalam `db.transaction()`. DILARANG menggunakan global context expectation. Pada HTTP driver, setiap `db.*` call adalah request terpisah. |
| **Relations API**                      | Menggunakan `relations()` di setiap schema file untuk mendukung `db.query.*` relational queries.                                                                                             |

### 🚧 Hambatan & Mitigasi
- **Issue**: PowerShell tidak mendukung operator `&&` untuk chaining command.
- **Mitigasi**: Jalankan command secara sequential (satu per satu), bukan di-chain.

### 📌 Catatan untuk Sesi Selanjutnya
- **Unit Kerja**: Eksekusi Steps 4→5→6→7 secara sequential (FK dependencies).
- **Kesiapan**: Pastikan `DATABASE_URL` di `.env` sudah mengarah ke instance Neon yang valid.
- **Files yang akan dibuat**: 11 file schema baru + 1 custom migration SQL (via `drizzle-kit generate --custom`).
- **Verifikasi**: `typecheck`, `drizzle-kit generate`, dan `test:run` setelah setiap step.
- **Step 7 (RLS)**: Applied via `pnpm db:migrate` (BUKAN manual push ke Neon Console).

---

## 📅 Session: 2026-04-12 — Sesi 1 (Initial Stabilization)

### 📝 Status Saat Ini
Infrastruktur dasar backend (ORM, RPC, Testing) sudah terpasang dan terkonfigurasi. Modul yang tidak relevan (PPDB & Alumni) sudah dibersihkan secara total.

### 🛠️ File yang Diubah/Dibuat
- **Deleted**: `src/features/ppdb/`, `src/features/alumni/` (seluruh folder)
- **Deleted**: `src/routes/_authenticated/ppdb/`, `allumni/`
- **Modified**: `src/components/layout/data/sidebar-data.ts` (Hapus navigasi)
- **Modified**: `src/lib/constants.ts` (Hapus dead code)
- **Created**: `vitest.config.ts`, `drizzle.config.ts`
- **Created**: `src/lib/decimal-setup.ts`, `src/server/db/index.ts`, `src/server/db/schema/index.ts`
- **Modified**: `package.json`, `tsconfig.node.json`, `.env.example`

### ⚖️ Keputusan Teknis (Log Keputusan)
| Keputusan                   | Justifikasi                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Decimal.js Global Setup** | ADR-07 mewajibkan presisi finansial. Setup global menggunakan `ROUND_HALF_UP` dan presisi 20 digit untuk IDR.                          |
| **oRPC Scoped Packages**    | Mengeksekusi instalasi `@orpc/server`, `@orpc/client`, dan `@orpc/tanstack-query` sebagai standar komunikasi type-safe terbaru (2026). |
| **Skip Raw PG Driver**      | Menggunakan `@neondatabase/serverless` saja karena arsitektur menggunakan Neon. Lebih efisien untuk lingkungan serverless.             |
| **RouteTree Regeneration**  | Membiarkan `routeTree.gen.ts` teregenerasi otomatis via Vite plugin untuk menghindari inkonsistensi rute.                              |

### 🚧 Hambatan & Mitigasi
- **Issue**: Terminal `pwsh` sempat hang saat instalasi pnpm gara-gara loading profile.
- **Mitigasi**: Eksekusi command terminal wajib menggunakan `-NoProfile` untuk stabilitas di lingkungan agent.

### 📌 Catatan untuk Sesi Selanjutnya
- **Unit Kerja**: Section 2 (Implementasi Skema Database)
- **Kesiapan**: Pastikan `DATABASE_URL` di `.env` sudah mengarah ke instance Neon yang valid.
- **Goal**: Menjalankan `pnpm db:push` pertama kali setelah tabel `schools` dan `units` selesai didefinisikan di Step 4.

---

## 📈 Milestone Tracker
- [x] Step 1: Cleanup Out-of-Scope Modules
- [x] Step 2: Backend & Testing Dependencies
- [x] Step 3: Drizzle & Neon Configuration
- [x] Step 4: Core Tenant Schema (schools, users, academic-years)
- [x] Step 5: Operational Schema (teachers, students, classes, enrollments)
- [x] Step 6: Financial Schema (spp, cashflow, events, logs)
- [x] Step 7: Row Level Security (RLS) Migration
- [ ] Step 8: Auth Integration (Next)
- [ ] ... (Steps 9-34)

