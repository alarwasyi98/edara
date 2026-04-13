---
trigger: always_on
---

# Instruksi Sistem - Proyek EDARA

File ini mendefinisikan aturan mutlak, konteks arsitektur, dan standar pengodean untuk proyek EDARA. **Semua AI agent yang berinteraksi dengan repositori ini WAJIB membaca dan mematuhi aturan di bawah ini sebelum mengenerate atau memodifikasi kode.**

## 1. Identitas Proyek & Tech Stack

- **Nama Proyek:** EDARA (Sistem Administrasi Madrasah Multi-Tenant)
- **Fase Saat Ini:** Phase 1 (Migrasi dari Mock ke Real Backend)
- **Frontend:** React 19, TanStack Start (Mode Vite SPA - **TIDAK ADA SSR** untuk Phase 1), TanStack Router, TanStack Query, Zustand, Tailwind CSS v4, shadcn/ui.
- **Backend:** TanStack Start Server (hanya sebagai API), oRPC, Clerk SDK.
- **Database:** Neon Serverless PostgreSQL, Drizzle ORM, pg-boss (Colocated - berjalan di proses server yang sama).

## 2. Aturan Arsitektur Mutlak (Berdasarkan ADR)

Semua implementasi **TIDAK BOLEH** melanggar keputusan berikut:

1. **Vite SPA (ADR-01):** Jangan generate kode SSR (seperti `loader` atau pola `getServerSideProps`). Semua fetching data dilakukan di client-side via oRPC + TanStack Query.
2. **Multi-Tenancy & RLS (ADR-02):** Setiap tabel terkait entitas _tenant_ **WAJIB** memiliki `school_id` (dan `unit_id` jika di bawah unit). Pastikan Row Level Security (RLS) diaktifkan dan Drizzle middleware melakukan `set_config` sebelum query.
3. **Status Keuangan Dihitung (ADR-03):** Status SPP (paid/partial/unpaid) **TIDAK PERNAH DISIMPAN** sebagai kolom statis. Selalu hitung status via SQL Aggregation (`SUM(amount)` vs `net_amount`).
4. **Append-Only Transactions (ADR-04):** Tabel `payment_transactions` TIDAK boleh di-UPDATE atau di-DELETE di level aplikasi. Koreksi wajib menggunakan transaksi baru bertipe `reversal`.
5. **Activity Logs Terpusat (ADR-05):** Jangan gunakan query manual `db.insert(activityLogs)` di dalam blok mutasi. Wajib gunakan middleware `withActivityLog` pada oRPC procedure.
6. **Mata Pelajaran JSON (ADR-06):** Kolom `mataPelajaran` pada tabel `teachers` menggunakan JSON Array, bukan _junction table_.
7. **Skema Autentikasi (C7):** Auth menggunakan Clerk. Role dan unit assignment diupdate secara server-side via Clerk Management API (`updateUserMetadata`), BUKAN simulasi lokal.

## 3. Standar Kode & Keamanan (CRITICAL)

### Presisi Finansial (ADR-07)

- **DILARANG KERAS** menggunakan manipulasi `Number()`, `parseInt`, `parseFloat`, atau aritmatika bawaan JS (`+`, `-`) untuk logika keuangan (SPP, Cashflow).
- **WAJIB** menggunakan `decimal.js` untuk komputasi dan inisialisasi (`new Decimal(value)`).
- Di database Postgres, selalu gunakan tipe data `numeric` (yang akan menjadi string di JS runtime).

### Konvensi Penamaan

- **File / Folder:** `kebab-case` (contoh: `student-form-drawer.tsx`)
- **React Components:** `PascalCase` (contoh: `StudentFormDrawer`)
- **Fungsi / Hooks:** `camelCase` (contoh: `useStudentData`)
- **DB Tables / Columns:** `snake_case` (contoh: `payment_transactions`, `academic_year_id`)
- **Zod Schemas:** `camelCase` diakhiri "Schema" (contoh: `teacherCreateSchema`)

### Praktik Terbaik TypeScript

- Aktifkan strict mode. Dilarang menggunakan `any` (gunakan `unknown` jika perlu).
- Gunakan tipe kembalian eksplisit untuk fungsi publik.
- Ekspor interface/type yang bisa digunakan ulang ke folder `types/` atau di samping skema Drizzle.

## 4. Konteks Fase 1 Saat Ini (Audit Remediation)

AI Agent harus membantu menavigasi kode dari _mock-heavy state_ menuju _real backend state_.

- **Abaikan Fitur Luar Cakupan:** Jangan ubah, buat, atau sarankan kode untuk modul `ppdb` dan `alumni`. Fokus pada fitur inti MVP (Guru, Siswa, Kelas, SPP, Cashflow, Kalender).
- **Hapus Delay Palsu:** Hapus fungsi `sleep()` atau `mock-access-token` saat me-refactor file. Ganti dengan panggilan oRPC asli.
- **Testing Coverage:** Logika bisnis krusial (terutama formating keuangan dan perhitungan SPP) harus disertai dengan `vitest` unit tests.

---

> [!IMPORTANT]
> Catat semua aktivitas pada file `src/docs/reconciliation-log.md`

**Pesan Penutup untuk AI:** Jika pengguna meminta Anda membangun UI form, pastikan terintegrasi dengan `react-hook-form` + `zod` schema yang valid. Jika pengguna meminta integrasi API, pastikan menggunakan `useMutation` / `useQuery` dari oRPC router. Tetap berpegang pada kanon desain (Tailwind CSS v4 + shadcn/ui).