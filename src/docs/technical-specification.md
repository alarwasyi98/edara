---
name: technical-specification
description: Technical Specification for EDARA
status: draft
modified: 2026-04-12
version: 2.0.0
---

# EDARA — Technical Specification

**Changelog dari v1.0.0:**

- Tipografi dikoreksi dari Inter/JetBrains Mono ke Geist/Geist Mono (canonical)
- Design system diperluas: full component specs (button, card, input, badge, tab, table, icon, motion, layout)
- Semua 9 critical considerations diselesaikan dengan keputusan eksplisit (lihat Appendix C)
- UX flows diperluas per feature area
- Architectural Decision Records ditambahkan (Appendix D)
- Color system: light mode dan dark mode keduanya terdokumentasi lengkap

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Feature Specifications](#3-feature-specifications)
4. [Data Architecture](#4-data-architecture)
5. [API Specifications](#5-api-specifications)
6. [Security & Privacy](#6-security--privacy)
7. [User Interface Specifications](#7-user-interface-specifications)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Appendix A — Naming Conventions](#appendix-a--naming-conventions)
10. [Appendix B — Key Business Rules](#appendix-b--key-business-rules)
11. [Appendix C — Resolved Critical Considerations](#appendix-c--resolved-critical-considerations)
12. [Appendix D — Architectural Decision Records](#appendix-d--architectural-decision-records)

---

## 1. Executive Summary

### 1.1 Project Overview

EDARA (أدارة — "Administrasi") adalah platform SaaS administrasi sekolah multi-tenant yang dirancang untuk yayasan Islam Indonesia yang mengelola 2–10 unit pendidikan (MI, MTs, MA, SD, SMP, SMA, Pesantren). Sistem menggantikan alur kerja berbasis Excel dengan platform terstruktur dan berbasis peran yang mencakup manajemen siklus hidup siswa, catatan guru, penagihan SPP dengan skema subsidi fleksibel, pelacakan arus kas, dan kalender kegiatan.

**Primary Design Constraints:**

- Zero data loss pada transisi status — semua perubahan bersifat additive, tidak pernah destruktif
- Status dihitung secara dinamis dari agregat transaksi, tidak pernah disimpan sebagai kolom yang dapat dimutasi
- Isolasi multi-tenant diterapkan di lapisan database (PostgreSQL RLS), bukan hanya lapisan aplikasi
- Frontend Vite SPA untuk Phase 1 dengan mock data yang strukturnya identik dengan schema backend yang direncanakan

### 1.2 Key Technical Decisions

| Keputusan            | Pilihan                      | Rationale                                                                                    |
| -------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| Full-stack Framework | TanStack Start               | Type-safe, file-based routing, Vite-native; SSR diaktifkan di Phase 2                        |
| Render Mode Phase 1  | Vite SPA                     | Tidak ada infrastruktur backend real yang perlu di-SSR; simplifikasi deployment              |
| API Layer            | oRPC                         | End-to-end TypeScript type safety, zero schema drift, integrasi native dengan TanStack Query |
| Auth Provider        | Clerk                        | Managed sessions, JWT dengan custom claims, MFA — mengurangi kompleksitas auth               |
| Database             | PostgreSQL (Neon Serverless) | Serverless scaling, branching untuk dev/staging, mendukung RLS policies                      |
| ORM                  | Drizzle                      | Type-safe schema-first, zero-overhead query builder, native Neon support                     |
| Background Jobs      | pg-boss                      | PostgreSQL-native job queue — tidak perlu Redis, memanfaatkan Neon instance yang ada         |
| State Management     | Zustand + TanStack Query     | TanStack Query untuk server state; Zustand untuk UI state ephemeral                          |
| Styling              | Tailwind CSS v4 + shadcn/ui  | Design token system, headless components, kustomisasi penuh via CSS variables                |
| Form Management      | React Hook Form + Zod        | Schema-driven validation, performant, shared schemas antara client dan server                |

### 1.3 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Client)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Vite SPA (Phase 1)                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │   │
│  │  │ TanStack │ │ Zustand  │ │  shadcn/ui +    │ │   │
│  │  │  Router  │ │  Store   │ │  Tailwind CSS   │ │   │
│  │  └────┬─────┘ └──────────┘ └─────────────────┘ │   │
│  │       │  TanStack Query (oRPC Client)           │   │
│  └───────┼─────────────────────────────────────────┘   │
└──────────┼──────────────────────────────────────────────┘
           │ HTTPS / oRPC (JSON over HTTP)
┌──────────┼──────────────────────────────────────────────┐
│          │        TanStack Start Server                 │
│  ┌───────┴──────────────────────────────────────────┐  │
│  │              oRPC Router                         │  │
│  │  auth │ schools │ students │ spp │ cashflow …    │  │
│  │              ↓ Middleware Stack                  │  │
│  │  ClerkAuth → TenantCtx → UnitCtx → RBAC → Log   │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────┼────────────────────────────┐ │
│  │   Drizzle ORM + RLS   │  pg-boss (same process)    │ │
│  │   ┌────────────┐  ┌───┴────────┐  ┌─────────────┐ │ │
│  │   │  Workers   │  │  Neon PG   │  │Clerk (Auth) │ │ │
│  │   │ (colocated)│  │  + RLS     │  │   Service   │ │ │
│  │   └────────────┘  └────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture

### 2.1 Architecture Overview

EDARA menggunakan **TanStack Start** sebagai unified full-stack framework. Server functions (`createServerFn`) dieksekusi di server dan dipanggil secara transparan dari React components, sementara oRPC router menangani HTTP API calls yang dikonsumsi via TanStack Query.

**Key Architectural Patterns:**

**Multi-Tenancy via Shared Schema:** Setiap tabel database membawa `school_id` (tenant) dan opsional `unit_id` (sub-tenant). PostgreSQL Row Level Security policies menerapkan isolasi di lapisan database, independen dari kode aplikasi. Clerk JWT token menyematkan `schoolId` dan `unitId` sebagai custom claims; Drizzle middleware mengekstrak ini dan menetapkan variabel sesi Postgres `app.current_school` sebelum setiap query.

**Computed State over Stored Status:** Status pembayaran SPP (paid/partial/unpaid) tidak pernah disimpan — diturunkan via SQL aggregation dari `payment_transactions` pada waktu query. Ini menjamin konsistensi dan memungkinkan mekanisme reversal tanpa korupsi data.

**Append-Only Financial Records:** `payment_transactions` tidak memiliki kolom `updated_at` dan tidak ada izin UPDATE/DELETE di tingkat aplikasi. Koreksi menggunakan reversal transactions yang mereferensikan ID transaksi asli.

**Centralized Activity Log via Middleware:** Setiap oRPC `.mutation()` secara otomatis dibungkus oleh `activityLogMiddleware`. Developer tidak perlu memanggil `logActivity()` secara manual di setiap prosedur. Middleware membaca `action`, `entityType`, `entityId` dari metadata prosedur yang terdaftar.

**pg-boss Colocation:** Untuk Phase 1/MVP, worker pg-boss berjalan dalam proses yang sama dengan TanStack Start server. Tidak ada container terpisah. Worker di-start di `server/jobs/index.ts` yang diimport oleh server entry point.

### 2.2 Data Flow Diagram

```
User Action (contoh: "Catat Pembayaran")
  │
  ▼
React Component (SPP form)
  │  React Hook Form + Zod validation (client-side)
  ▼
oRPC Client call via TanStack Query mutation
  │  useMutation(orpc.spp.recordPayment)
  ▼
TanStack Start Server (HTTP handler)
  │
  ├── Clerk middleware: validasi JWT, extract userId, schoolId, unitId, role
  ├── requireUnitContext: set RLS session variable di Postgres
  ├── requireRole: periksa role terhadap RBAC matrix
  ├── activityLogMiddleware: siapkan log context
  │
  ▼
oRPC Procedure: spp.recordPayment
  │
  ├── Zod validation (server-side, schema yang sama)
  ├── Drizzle transaction:
  │     1. Query payment_bills untuk net amount
  │     2. INSERT payment_transactions
  │     3. Jika overpayment: INSERT payment_transactions (type=overpayment)
  │     4. INSERT cashflow_transactions (auto-link)
  │     5. INSERT activity_logs (via middleware post-hook)
  │     6. Opsional: queue pg-boss job
  ▼
TanStack Query cache invalidation → UI auto-updates
```

### 2.3 Technology Stack

#### Frontend

| Teknologi            | Versi  | Tujuan                                          |
| -------------------- | ------ | ----------------------------------------------- |
| React                | ^19.x  | UI framework                                    |
| TanStack Start       | latest | Full-stack framework (SPA Phase 1, SSR Phase 2) |
| TanStack Router      | ^1.x   | File-based routing, type-safe                   |
| TanStack Query       | ^5.x   | Server state, caching, mutations                |
| Zustand              | ^5.x   | UI state (active unit, sidebar, theme)          |
| Tailwind CSS         | ^4.x   | Utility-first CSS, design tokens                |
| shadcn/ui (Radix UI) | latest | Headless accessible components, "Mira" config   |
| React Hook Form      | ^7.x   | Form state management                           |
| Zod                  | ^4.x   | Schema validation (shared dengan server)        |
| Recharts             | ^2.x   | Charts — cashflow, SPP trends                   |
| react-big-calendar   | latest | Calendar view untuk events                      |
| Lucide React         | ^0.5x  | Icon library                                    |
| Sonner               | latest | Toast notifications                             |

#### Backend

| Teknologi               | Versi  | Tujuan                                  |
| ----------------------- | ------ | --------------------------------------- |
| TanStack Start (server) | latest | Node.js server, API handler             |
| oRPC                    | latest | Type-safe RPC layer                     |
| Clerk SDK               | ^5.x   | Auth JWT validation, user management    |
| Drizzle ORM             | latest | Type-safe SQL query builder             |
| pg-boss                 | latest | PostgreSQL-native job queue (colocated) |
| ExcelJS                 | latest | Excel file generation (exports)         |
| SheetJS (xlsx)          | latest | Excel file parsing (imports)            |
| pdf-lib                 | latest | PDF generation (reports)                |

#### Infrastructure

| Teknologi                    | Tujuan                                |
| ---------------------------- | ------------------------------------- |
| Neon (serverless PostgreSQL) | Primary database + pg-boss queue      |
| Clerk                        | Identity provider, session management |
| Vercel / Netlify             | Deployment platform                   |
| pnpm                         | Package manager                       |
| Vitest                       | Unit & integration testing            |

### 2.4 Module Dependency Map

```
┌─────────────────────────────────────────────────┐
│                   Shared Layer                  │
│  src/lib/validators/   src/lib/constants/       │
│  src/lib/utils/        src/lib/formatters/      │
└───────────────────────────┬─────────────────────┘
                            │
          ┌─────────────────┼──────────────────────┐
          ▼                 ▼                      ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  UI Layer    │  │  Feature Layer   │  │  Server Layer   │
│ components/  │  │  features/       │  │  server/        │
│ ui/          │  │  ├── auth/       │  │  ├── db/        │
│ data-table/  │  │  ├── dashboard/  │  │  ├── routers/   │
│ layout/      │  │  ├── teachers/   │  │  ├── middleware/ │
│ shared/      │  │  ├── students/   │  │  └── jobs/      │
└──────────────┘  │  ├── classes/    │  └─────────────────┘
                  │  ├── spp/        │
                  │  ├── cashflow/   │
                  │  └── events/     │
                  └──────────────────┘
```

---

## 3. Feature Specifications

### 3.1 Multi-Tenant & Organizational Structure

#### User Stories & Acceptance Criteria

| ID    | User Story                                                                    | Acceptance Criteria                                                                                               |
| ----- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| MT-01 | Admin Yayasan mendaftarkan yayasan dengan nama, logo, alamat, nomor legalitas | Foundation dibuat dengan semua field terpersistens; logo disimpan sebagai URL; redirect ke halaman pembuatan unit |
| MT-02 | Admin Yayasan membuat unit pendidikan di bawah yayasan                        | Unit dibuat dengan jenjang, NPSN, alamat, kontak; unit terisolasi dari unit lain                                  |
| MT-03 | Admin Yayasan melihat metrik agregat lintas semua unit                        | Dashboard menampilkan jumlah siswa, guru, pemasukan SPP bulanan di semua unit                                     |
| MT-04 | Pengguna scoped-unit hanya mengakses data unit yang ditetapkan                | Query tanpa konteks unit yang valid mengembalikan 403; RLS policy menerapkan ini di level DB                      |
| MT-05 | Super Admin dapat beralih konteks unit aktif                                  | Unit switcher di header; beralih konteks me-reset data dashboard aktif                                            |

#### Komponen UI Utama

**Halaman Grid Unit:**

- Grid 3 kolom (desktop), 2 kolom (tablet), 1 kolom (mobile)
- Setiap kartu: avatar/logo unit, nama unit, badge jenjang berwarna (MI/MTs/MA = Forest, SD/SMP/SMA = biru), NPSN, jumlah siswa aktif, badge status Aktif/Nonaktif
- Hover: elevasi ringan dengan shadow transition 150ms ease-out
- Aksi via ikon `···` per kartu: "Edit Unit", "Nonaktifkan"

**Unit Switcher (Topbar):**

- Tampilkan nama unit aktif + chevron-down
- Klik → dropdown list unit dengan scrollable area
- Setiap item: nama unit + badge jenjang; item aktif: checkmark + background accent
- Mobile: dropdown berubah menjadi bottom sheet dari bawah layar
- Pengguna dengan satu unit: switcher diganti teks statis nama unit

**Add/Edit Unit (Side Drawer 480px):**

- Section Identitas: Nama Unit*, Jenjang* (dropdown dengan optgroup), NPSN
- Section Lokasi & Kontak: Alamat, Kota, Nomor HP, Email Unit
- Footer sticky: Batal + Simpan

#### Technical Implementation

```typescript
// middleware/tenant-context.ts
export async function resolveTenantContext(
  clerkUserId: string,
): Promise<TenantContext> {
  const userAssignments = await db.query.userSchoolAssignments.findMany({
    where: eq(userSchoolAssignments.clerkUserId, clerkUserId),
    with: { school: true, unit: true },
  });
  // Auto-select jika single unit; require explicit unitId jika multi-unit
  return { schoolId, unitId, role };
}
```

```typescript
// stores/tenant-store.ts
interface TenantStore {
  activeSchoolId: string | null;
  activeUnitId: string | null;
  availableUnits: Unit[];
  switchUnit: (unitId: string) => void;
}
```

---

### 3.2 Authentication & Role-Based Access Control

#### User Stories & Acceptance Criteria

| ID      | User Story                                          | Acceptance Criteria                                                                                |
| ------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| AUTH-01 | User login dengan email dan password                | Clerk menangani auth; JWT dengan custom claims (schoolId, unitId, role) diterbitkan                |
| AUTH-02 | User multi-unit melihat unit selector setelah login | Jika user memiliki >1 assignment unit, halaman pemilih unit muncul sebelum redirect ke dashboard   |
| AUTH-03 | Super Admin membuat dan mengelola akun user         | Pembuatan user via Clerk Admin API; assignment role dan unit disimpan di `user_school_assignments` |
| AUTH-04 | Halaman unauthorized menampilkan pesan informatif   | Route guards memeriksa role; render `<UnauthorizedState>` — sidebar tetap terlihat                 |
| AUTH-05 | Admin menetapkan role dan unit ke user              | Assignment update `user_school_assignments`; perubahan efektif pada token refresh berikutnya       |

#### RBAC Matrix

| Role             | Scope   | Siswa | Guru | Kelas | SPP  | Cashflow | Users | Settings |
| ---------------- | ------- | ----- | ---- | ----- | ---- | -------- | ----- | -------- |
| `super_admin`    | Yayasan | CRUD  | CRUD | CRUD  | CRUD | CRUD     | CRUD  | CRUD     |
| `kepala_sekolah` | Unit    | Read  | Read | Read  | Read | Read     | —     | Read     |
| `admin_tu`       | Unit(s) | CRUD  | CRUD | CRUD  | Read | —        | —     | Limited  |
| `bendahara`      | Unit(s) | Read  | Read | Read  | CRUD | CRUD     | —     | —        |

#### Komponen UI Utama

**Login Page (Desktop):** Split layout — kiri 40% branding (logo, tagline, ilustrasi madrasah palet Forest + Amber); kanan 60% form pada background putih.

**Login Page (Mobile):** Branding disembunyikan; form full-screen; logo kecil di tengah atas; tombol "Masuk" full-width.

**Error State:** Banner merah di atas form, animasi shake horizontal 300ms. Setelah 5 kali gagal: tombol di-disable + countdown timer.

**Unauthorized Page:** Dashboard shell utuh (sidebar, topbar); konten: ilustrasi kunci, teks "Anda tidak memiliki akses ke halaman ini", penjelasan role yang dibutuhkan, dua CTA: "Kembali" dan "Ke Beranda".

#### Implementation Notes

```typescript
// Clerk JWT template (dikonfigurasi di Clerk dashboard)
{
  "schoolId": "{{user.public_metadata.schoolId}}",
  "unitId": "{{user.public_metadata.activeUnitId}}",
  "role": "{{user.public_metadata.role}}"
}
```

**Clerk publicMetadata Update Flow:** Saat Super Admin mengubah role/unit user, aplikasi memanggil Clerk Management API dari oRPC server procedure `users.updateRole`. Perubahan berlaku pada token refresh berikutnya (~15 menit) atau saat user logout-login.

```typescript
// server/routers/users.ts
updateRole: procedure
  .use(requireRole(['super_admin']))
  .input(z.object({ clerkUserId: z.string(), role: userRoleEnum, unitIds: z.array(z.string().uuid()) }))
  .mutation(async ({ input }) => {
    await clerkClient.users.updateUserMetadata(input.clerkUserId, {
      publicMetadata: { role: input.role, activeUnitId: input.unitIds[0], schoolId: context.schoolId }
    });
    // Sync ke DB
    await db.insert(userSchoolAssignments).values(/* assignments */);
  }),
```

---

### 3.3 Academic Year Management

#### User Stories & Acceptance Criteria

| ID    | User Story                                                          | Acceptance Criteria                                                                    |
| ----- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| AY-01 | Admin membuat tahun pelajaran dengan nama, tanggal mulai/selesai    | Tersimpan ke `academic_years`; dapat langsung diaktifkan                               |
| AY-02 | Hanya satu tahun pelajaran aktif per unit dalam satu waktu          | DB constraint: partial unique index pada `(unit_id, is_active) WHERE is_active = true` |
| AY-03 | Mengaktifkan tahun baru otomatis menonaktifkan tahun aktif saat ini | DB transaction: UPDATE previous → is_active=false, UPDATE new → is_active=true         |
| AY-04 | Semua kelas, enrollments, tagihan terikat ke tahun pelajaran        | Semua tabel terkait memiliki FK `academic_year_id` yang tidak nullable                 |

#### Komponen UI Utama

**Daftar Tahun Pelajaran (Timeline Vertikal):**

- Item terbaru di atas; setiap item: nama, rentang tanggal, badge status
- Item aktif: border kiri tebal Forest + label "Aktif Saat Ini"
- Aksi via `···`: Aktifkan / Lihat Ringkasan / Hapus (hanya jika tidak ada data)

**Form Tambah (Modal):**

- Nama\* (auto-suggest berdasarkan tahun aktif + 1)
- Date picker tanggal mulai* dan selesai*; helper text durasi real-time
- Validasi overlap tanggal saat field blur

**Aktivasi Flow:**

- Confirmation dialog menyebut secara eksplisit tahun yang dinonaktifkan dan diaktifkan
- Post-aktivasi: toast success + CTA inline "Atur Kelas Sekarang →"

**Edge Cases:**

- Penghapusan tahun dengan data: diblokir dengan pesan "X kelas dan Y tagihan terikat pada tahun ini"
- Tahun nonaktif dengan data historis: tombol Edit disembunyikan; hanya "Lihat Ringkasan" tersedia

#### Technical Notes

```sql
CREATE UNIQUE INDEX academic_years_one_active_per_unit
ON academic_years (unit_id) WHERE is_active = TRUE;
```

---

### 3.4 Analytics Dashboard

#### User Stories & Acceptance Criteria

| ID      | User Story                                                          | Acceptance Criteria                                                                       |
| ------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| DASH-01 | Semua role melihat satu dashboard yang sama dengan widget read-only | Tidak ada conditional rendering per role di level konten — hanya sidebar berbeda          |
| DASH-02 | StatCards menampilkan jumlah real-time                              | Data di-fetch via oRPC dashboard procedures dengan TanStack Query; stale-while-revalidate |
| DASH-03 | Chart cashflow menampilkan tren 6 bulan (pemasukan vs pengeluaran)  | Recharts BarChart grouped dengan dua seri; data dari agregat cashflow_transactions        |
| DASH-04 | Daftar kegiatan mendatang menampilkan 3–5 event terdekat            | Filter `start_date >= NOW()` ordered ASC, limit 5                                         |
| DASH-05 | Activity log menampilkan aksi sistem terbaru                        | Feed dari `activity_logs` ordered DESC, limit 10 per halaman                              |

#### Komponen UI Utama

**Layout Desktop (3 baris):**

Baris 1 — Summary Cards (3 kartu horizontal):

- Total Siswa Aktif: ikon siswa, angka besar bold, subtext "Tahun Pelajaran Aktif", delta vs bulan lalu
- Total Guru Aktif: ikon orang, angka, delta
- Pemasukan SPP Bulan Ini: ikon Rp, angka currency, delta %
- Delta colors: hijau = naik, merah = turun, abu-abu = flat

Baris 2 — Chart & Kegiatan (dua kolom):

- Kiri 60%: Chart Tren Arus Kas 6 bulan; bar grouped (Forest = pemasukan, Amber = pengeluaran); bulan mendatang jika dalam window = bar outline opacity 40%
- Kanan 40%: Kegiatan Mendatang; list 3–5 item; chip kategori berwarna + nama bold + tanggal relatif

Baris 3 — Log Aktivitas (full-width):

- Feed kronologis 10 entri; avatar inisial (lingkaran berwarna per role badge); nama + aksi; timestamp relatif
- Entri di-group per hari jika lintas hari

**Mobile:** Single column; summary cards stack vertikal; chart full-width; kegiatan di bawah chart; log paling bawah.

**Empty State (Unit Baru):** Summary cards tampilkan "0"; chart tampilkan skeleton grid kosong; log: "Belum ada aktivitas tercatat".

---

### 3.5 Teacher Management

#### User Stories & Acceptance Criteria

| ID     | User Story                                                             | Acceptance Criteria                                                                    |
| ------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| TCH-01 | Admin menambah guru dengan data identitas dan kepegawaian lengkap      | Semua field wajib divalidasi server-side; foto disimpan sebagai URL                    |
| TCH-02 | Daftar guru mendukung pencarian dan filter                             | Full-text search via Drizzle `ilike`; filter faceted diterapkan sebagai WHERE clause   |
| TCH-03 | Admin soft-delete (nonaktifkan) guru                                   | `is_active = false`; data tetap di DB; toggle filter visibilitas                       |
| TCH-04 | Bulk import dari Excel dengan preview, highlight error, partial import | SheetJS parse file; server validasi tiap baris; baris valid diimport dalam transaction |
| TCH-05 | Ekspor mengikuti filter aktif                                          | Server menerapkan kondisi filter yang sama ke query ekspor                             |

#### Komponen UI Utama

**Page Header:** Judul + badge counter total; tombol "+ Tambah Guru" (primary); "Import" dan "Ekspor" (secondary).

**Filter Bar:** Dropdown Status Kepegawaian; dropdown Mata Pelajaran (multi-select + search); toggle "Tampilkan Nonaktif". Filter aktif ditampilkan sebagai chip removable.

**Tabel:** Avatar, Nama (bold, pin kiri), NIK, Status Kepegawaian (badge), Mata Pelajaran (truncate >2 dengan tooltip), Tanggal Bergabung, Status, Aksi (`···`).

**Add/Edit Side Drawer (520px):** Section Identitas (Nama*, NIK*, TTL, Jenis Kelamin sebagai toggle card); Section Kepegawaian (Status*, Mata Pelajaran multi-select, Tanggal Bergabung*, HP, Alamat); upload foto circle-crop.

**Bulk Import Flow (4 Steps):**

1. Unduh Template
2. Upload File (.xlsx/.csv) — drag-and-drop zone
3. Preview & Validasi — baris error: background merah muda + error per kolom; counter "X valid · Y error"
4. Konfirmasi Import — progress bar real-time; post-import: "X berhasil, Y dilewati" + tombol "Unduh Log Error"

```typescript
const teacherImportRowSchema = z.object({
  namaLengkap: z.string().min(3).max(255),
  nik: z.string().length(16).regex(/^\d+$/),
  tempatLahir: z.string().min(2),
  tanggalLahir: z.string().date(),
  jenisKelamin: z.enum(["L", "P"]),
  statusKepegawaian: z.enum(["tetap", "honorer", "gtt"]),
  mataPelajaran: z.string().optional(),
  nomorHp: z.string().optional(),
  tanggalBergabung: z.string().date().optional(),
});
```

---

### 3.6 Class Management

#### User Stories & Acceptance Criteria

| ID     | User Story                                      | Acceptance Criteria                                                                            |
| ------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| CLS-01 | Admin membuat kelas terikat tahun pelajaran     | Record `classes` memiliki `academic_year_id` tidak nullable                                    |
| CLS-02 | Daftar kelas menampilkan progress bar kapasitas | Jumlah enrollment aktif vs field `capacity`                                                    |
| CLS-03 | Kenaikan kelas massal via 3-step modal          | DB transaction: batch UPDATE enrollments (lama → 'promoted') + batch INSERT enrollments (baru) |

#### Komponen UI Utama

**Class Grid (per tingkat):**

- Subheader per tingkat: "Kelas 7 · 3 Kelas"
- Kartu: nama kelas, wali kelas (nama + avatar 24px), progress bar kapasitas (hijau <80%, kuning 80–100%, merah ≥100%)
- Dropdown Tahun Pelajaran di kanan atas; ganti tahun → grid refresh fade

**Kenaikan Kelas Massal (3-Step Modal):**

1. Konfirmasi siswa: tabel + checkbox (semua centang default)
2. Pilih kelas tujuan di tahun pelajaran berikutnya
3. Summary + warning merah "Aksi ini tidak dapat dibatalkan" + tombol "Konfirmasi Kenaikan Kelas"

**Edge Cases:**

- Belum ada tahun pelajaran berikutnya: CTA dalam modal "Buat Tahun Pelajaran Baru dulu"
- Kelas penuh saat tambah siswa: warning non-blocking

---

### 3.7 Student Management

#### User Stories & Acceptance Criteria

| ID     | User Story                                                           | Acceptance Criteria                                                                             |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| STU-01 | Admin mendaftarkan siswa baru + enrollment langsung                  | Siswa dibuat di `students`; enrollment dibuat di `enrollments` linking ke kelas dan tahun aktif |
| STU-02 | Daftar siswa filter per kelas, tahun, status enrollment              | Server-side filtering; pagination dengan cursor                                                 |
| STU-03 | Halaman detail siswa menampilkan riwayat lengkap per tab             | Riwayat Kelas: semua `enrollments`. Riwayat Pembayaran: semua `payment_transactions`            |
| STU-04 | Admin memproses perubahan status: naik kelas, mutasi, lulus          | Setiap perubahan insert ke `enrollment_status_history`; enrollment status di-update             |
| STU-05 | Bulk import mendeteksi NISN duplikat + opsi skip/overwrite per baris | Server query NISN existing sebelum import; baris duplikat highlight kuning; toggle per baris    |
| STU-06 | Ekspor mengikuti filter aktif                                        | Parameter filter yang sama dikirim ke endpoint ekspor                                           |

#### Komponen UI Utama

**Pendaftaran Siswa (Side Drawer):**

- Section Identitas Permanen: Nama*, NISN*, NIK, TTL, Jenis Kelamin (toggle card), Foto opsional
- Section Data Keluarga: Nama Wali*, HP Wali*, Alamat
- Section Penempatan Kelas (card berbeda, latar accent): Tahun Pelajaran (default aktif), Kelas\*
- Post-save success state: nama siswa, kelas, dua CTA "Lihat Profil" / "Daftar Siswa Lain"

**Halaman Detail Siswa (Full Page):**

- Header: Avatar 80px, Nama (H1), NISN & NIK (muted), badge status enrollment, tombol "Edit Profil" + dropdown "Ubah Status"
- Tab Riwayat Kelas: Timeline vertikal; setiap node: tahun pelajaran, kelas, wali kelas, status akhir; node aktif di-highlight + pulse animation ringan
- Tab Riwayat Pembayaran: Filter tahun pelajaran; tabel transaksi; reversal ditampilkan latar merah muda + label + link ke transaksi asal
- Tab Skema Pembayaran: Card per kategori — Tarif Dasar → Diskon → Tagihan Bersih (bold Forest)

**Student Status Transition Rules:**

```
active → promoted          (kenaikan kelas; butuh kelas tujuan + tahun)
active → transferred_out   (mutasi keluar; butuh sekolah tujuan + tanggal)
active → graduated         (lulus; butuh tanggal kelulusan; biasanya massal per angkatan)
active → inactive          (Admin-only; kasus tidak lazim)
```

**Bulk Import Siswa (4 Steps, identik Teacher Import) + Deteksi Duplikat:**

- Baris duplikat NISN: highlight kuning (berbeda dari merah error)
- Toggle per baris: "Skip" atau "Overwrite"
- Counter: "X baris valid · Y duplikat NISN · Z baris error"
- Step 4 summary: "X diimport baru, Y ditimpa, Z dilewati"

---

### 3.8 SPP Payment Management

#### 3.8a Configuration (Tariff & Discount)

| ID     | User Story                                                   | Acceptance Criteria                                                                                  |
| ------ | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| SPP-01 | Admin membuat kategori pembayaran dengan tipe periode        | Kategori tersimpan; enum periode: `monthly`, `annual`, `one_time`                                    |
| SPP-02 | Admin menetapkan tarif per kelas per kategori per tahun      | Tabel `class_payment_rates`; satu record per (class, category, academic_year)                        |
| SPP-03 | Admin menetapkan skema diskon per siswa                      | `discount_schemes` dikunci ke tahun pelajaran; tidak dapat diedit mid-year                           |
| SPP-04 | Tagihan di-generate otomatis saat tahun pelajaran diaktifkan | pg-boss job `generate-bills` membuat `payment_bills` untuk semua enrollment aktif × kategori bulanan |

**Halaman Konfigurasi SPP (Dua Tab):**

Tab "Kategori": Tabel dengan toggle aktif/nonaktif inline (auto-save + toast). Kolom: Nama, Periode (badge), Nominal Default, Status.

Tab "Tarif per Kelas" (Matriks): Baris = kelas, kolom = kategori aktif; sel = input currency editable inline; sel kosong tampilkan nominal default dalam abu-abu. Header kolom: tombol "Terapkan ke semua kelas" dengan confirmation dialog.

**Skema Diskon (dari Tab Skema Pembayaran di profil siswa):**

- Form dalam side drawer: Pilih Kategori (multi-select atau "Semua"), toggle Persen/Nominal Tetap, input nilai, dropdown Alasan
- Preview real-time: Tarif Dasar → Diskon → Tagihan Bersih (bold Forest)
- Lock mechanism: setelah tahun pelajaran diaktifkan, tombol diganti badge "Terkunci 🔒" + tooltip
- Super Admin dapat override lock dengan alasan wajib yang tercatat di audit log

**Billing Cancellation Policy (Critical Decision C4):** `payment_bills` memiliki kolom `status` enum `active | cancelled`. Bill yang belum memiliki `payment_transactions` boleh di-cancel (soft-cancel). Bill dengan transaksi tidak dapat di-cancel — koreksi melalui reversal di level transaksi.

#### 3.8b Payment Recording

| ID     | User Story                                   | Acceptance Criteria                                                                                            |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SPP-05 | Bendahara mencatat pembayaran untuk siswa    | Transaksi di-insert ke `payment_transactions`; jumlah dapat parsial atau multi-periode                         |
| SPP-06 | Kelebihan bayar di-flag dan dicatat terpisah | Jika `amount_paid > net_amount`, insert record tambahan dengan `transaction_type = 'overpayment'`              |
| SPP-07 | Pembayaran append-only; koreksi via reversal | Tidak ada UPDATE/DELETE pada `payment_transactions`; reversal membuat record baru yang mereferensikan original |

**Payment Recording Flow:**

Step 1 — Pilih Siswa: Search autocomplete debounce 300ms; setelah dipilih: kartu info siswa (foto, nama, kelas, status enrollment).

Step 2 — Pilih Periode & Tagihan: Checkbox list periode belum/sebagian dibayar; multi-select; total akumulasi real-time di footer section.

Step 3 — Input Pembayaran:

- Input "Jumlah Dibayarkan" (format Rp)
- Kalkulasi live: Tagihan Total / Dibayarkan / Kekurangan (merah) atau Kelebihan (amber)
- Overpayment Banner amber: tidak dapat di-dismiss sampai submit

Step 4 — Detail Transaksi: Tanggal (default hari ini, editable), Metode (toggle card: Tunai/Transfer/QRIS), Catatan opsional.

Post-Save: Receipt modal dengan nama siswa, kelas, periode, jumlah, metode, nomor referensi. Tombol "Cetak Kwitansi" + "Selesai".

**Reversal Flow:** Akses via `···` per baris di riwayat pembayaran. Side drawer: detail transaksi asal (read-only), input Alasan wajib, tombol konfirmasi. Post-reversal: transaksi asli mendapat label "Reversed" + strikethrough + latar merah muda; transaksi reversal baru di bawahnya dengan ikon ↩.

#### 3.8c Monitoring & Reports

| ID     | User Story                                  | Acceptance Criteria                                                                    |
| ------ | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| SPP-08 | Bendahara melihat matriks status pembayaran | Matriks computed server-side; sel berwarna: paid/partial/unpaid/exempt                 |
| SPP-09 | Bendahara melihat daftar tunggakan          | Siswa dengan status 'unpaid' atau 'partial', diurutkan per jumlah tunggakan            |
| SPP-10 | Ekspor ke Excel/PDF mengikuti filter aktif  | Parameter filter yang sama dikirim ke endpoint ekspor; pg-boss menangani generasi file |

**Payment Matrix UI:**

- Tabel sticky: kolom nama siswa freeze kiri, header bulan freeze atas
- Sel: kotak warna solid (bukan teks); legenda non-dismissible: Lunas/Belum/Sebagian/Bebas
- Hover tooltip: Periode, Tagihan Bersih, Dibayar, Sisa, Tanggal Bayar Terakhir
- Klik sel → side drawer "Input Cepat" dengan konteks siswa + periode terisi otomatis
- Mobile: default tampilkan "Daftar Tunggakan"; matriks tersedia via tab toggle

**Payment Status Computation (SQL):**

```sql
SELECT
  pb.id,
  pb.net_amount AS tagihan,
  COALESCE(SUM(CASE WHEN pt.transaction_type = 'payment' THEN pt.amount END), 0) AS terbayar,
  CASE
    WHEN COALESCE(SUM(CASE WHEN pt.transaction_type = 'payment' THEN pt.amount END), 0) = 0 THEN 'unpaid'
    WHEN COALESCE(SUM(CASE WHEN pt.transaction_type = 'payment' THEN pt.amount END), 0) >= pb.net_amount THEN 'paid'
    ELSE 'partial'
  END AS status
FROM payment_bills pb
LEFT JOIN payment_transactions pt ON pt.bill_id = pb.id AND pt.reversed_by IS NULL
WHERE pb.enrollment_id = $1 AND pb.billing_month = $2
GROUP BY pb.id, pb.net_amount;
```

---

### 3.9 Cashflow Management

#### User Stories & Acceptance Criteria

| ID    | User Story                                                          | Acceptance Criteria                                                                   |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| CF-01 | Bendahara mencatat transaksi pemasukan dan pengeluaran              | Insert ke `cashflow_transactions`; SPP income auto-link via `spp_payment_id` FK       |
| CF-02 | Bendahara mengelola kategori cashflow                               | CRUD pada `cashflow_categories`; soft-delete untuk kategori dengan transaksi existing |
| CF-03 | Laporan menampilkan pemasukan/pengeluaran per periode dengan grafik | Aggregate query di `cashflow_transactions`; Recharts BarChart                         |
| CF-04 | Ekspor laporan cashflow ke Excel atau PDF                           | pg-boss job generate file; download link dikembalikan                                 |

#### Komponen UI Utama

**Page Layout:**

- 3 summary cards: Total Pemasukan (Forest), Total Pengeluaran (merah), Saldo Bersih (biru; merah + ikon ⚠ jika negatif)
- Filter bar: date range picker, dropdown Kategori, toggle Jenis; filter aktif sebagai chip removable
- Chart tren bulanan + tabel transaksi di bawah

**Tabel Transaksi:** Tanggal, Jenis (chip: Pemasukan=Forest, Pengeluaran=merah), Kategori, Deskripsi, Jumlah, Metode, No. Referensi, Aksi. Transaksi SPP auto-link: `···` hanya "Lihat Detail SPP" — edit/hapus dikunci.

**Tambah Transaksi Modal:**

- Toggle besar "Pemasukan ↔ Pengeluaran" di atas — mengubah accent color seluruh modal sebagai visual feedback
- Dropdown Kategori dengan "Tambah Kategori Baru" inline (nested modal kecil)
- Kategori yang punya transaksi: hanya nonaktifkan, tidak hapus

---

### 3.10 Event Calendar

#### User Stories & Acceptance Criteria

| ID     | User Story                                                            | Acceptance Criteria                                               |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| EVT-01 | Admin membuat kegiatan dengan nama, kategori, tanggal, lokasi, status | Insert ke `school_events` dengan `unit_id` dan `academic_year_id` |
| EVT-02 | Semua user melihat kegiatan dalam tampilan tabel atau kalender        | Dua tab view: DataTable (shadcn) dan react-big-calendar           |
| EVT-03 | Summary cards menampilkan total, dibatalkan, lomba, tanpa tanggal     | Empat aggregate counts dihitung server-side                       |
| EVT-04 | Kegiatan tanpa tanggal ditampilkan di panel terpisah                  | Client filter `events.start_date IS NULL` untuk panel bawah       |

#### Komponen UI Utama

**Summary Cards (4, non-clickable):**

- Total Kegiatan (biru), Dibatalkan (merah), Lomba (amber), Tanpa Tanggal (abu-abu)

**Tab DataTable:**

- Filter: Kategori (multi-select chip), Status (dropdown), Rentang Tanggal
- Kolom: Nama Kegiatan (bold), Kategori (badge berwarna per kategori), Tanggal Mulai, Durasi (otomatis), Lokasi, Status, Aksi
- Baris dibatalkan: strikethrough + opacity 50%

**Tab Kalender:**

- Grid 7×5/6; header bulan + navigasi ← → dengan slide horizontal; hari ini: lingkaran Forest
- Event chips per tanggal berwarna sesuai kategori; >2 event: tampil 2 + "+N lainnya"
- Klik chip → side drawer detail; klik tanggal kosong (Admin only) → side drawer "Tambah Kegiatan" dengan tanggal pre-filled
- Panel "Kegiatan Tanpa Tanggal" di bawah grid: list chip nama kegiatan

**Side Drawer Detail/Edit:** Mode baca dan edit dalam drawer yang sama; konfirmasi pembatalan via dialog dengan alasan opsional; post-batal: chip berubah abu-abu, summary card "Dibatalkan" auto-increment.

---

## 4. Data Architecture

### 4.1 Complete Data Models (Drizzle Schema)

#### Core Tenant Tables

```typescript
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  address: text("address"),
  legalNumber: varchar("legal_number", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schoolUnits = pgTable(
  "school_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    level: varchar("level", { length: 50 }).notNull(), // MI, MTs, MA, SD, SMP, SMA, dll.
    npsn: varchar("npsn", { length: 20 }),
    address: text("address"),
    phone: varchar("phone", { length: 50 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    schoolIdx: index("school_units_school_idx").on(t.schoolId),
  }),
);
```

#### Academic Year

```typescript
export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    name: varchar("name", { length: 20 }).notNull(), // "2024/2025"
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    unitIdx: index("academic_years_unit_idx").on(t.unitId),
    // Diterapkan via partial unique index di migration:
    // CREATE UNIQUE INDEX ON academic_years (unit_id) WHERE is_active = TRUE
  }),
);
```

#### Teachers

```typescript
export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    nip: varchar("nip", { length: 50 }),
    nik: varchar("nik", { length: 16 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 255 }).notNull(),
    tempatLahir: varchar("tempat_lahir", { length: 100 }),
    tanggalLahir: date("tanggal_lahir"),
    jenisKelamin: varchar("jenis_kelamin", { length: 1 }).notNull(), // L atau P
    nomorHp: varchar("nomor_hp", { length: 20 }),
    alamat: text("alamat"),
    statusKepegawaian: varchar("status_kepegawaian", { length: 20 }).notNull(), // tetap, honorer, gtt
    mataPelajaran: text("mata_pelajaran"), // JSON array
    tanggalBergabung: date("tanggal_bergabung"),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    schoolUnitIdx: index("teachers_school_unit_idx").on(t.schoolId, t.unitId),
    nikIdx: index("teachers_nik_idx").on(t.nik),
  }),
);
```

#### Students (Identity Layer — Permanent)

```typescript
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    nis: varchar("nis", { length: 20 }),
    nisn: varchar("nisn", { length: 10 }).notNull(),
    namaLengkap: varchar("nama_lengkap", { length: 255 }).notNull(),
    nik: varchar("nik", { length: 16 }),
    tempatLahir: varchar("tempat_lahir", { length: 100 }),
    tanggalLahir: date("tanggal_lahir"),
    jenisKelamin: varchar("jenis_kelamin", { length: 1 }).notNull(),
    namaWali: varchar("nama_wali", { length: 255 }),
    nomorHpWali: varchar("nomor_hp_wali", { length: 20 }),
    namaAyah: varchar("nama_ayah", { length: 255 }),
    namaIbu: varchar("nama_ibu", { length: 255 }),
    alamat: text("alamat"),
    photoUrl: text("photo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    schoolUnitIdx: index("students_school_unit_idx").on(t.schoolId, t.unitId),
    nisnIdx: uniqueIndex("students_nisn_school_unique").on(t.nisn, t.schoolId),
  }),
);
```

#### Classes

```typescript
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    name: varchar("name", { length: 50 }).notNull(), // "7A", "X IPA 1"
    gradeLevel: integer("grade_level").notNull(), // 7, 8, 9, 10, 11, 12
    homeroomTeacherId: uuid("homeroom_teacher_id").references(
      () => teachers.id,
    ),
    capacity: integer("capacity").default(32).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    yearIdx: index("classes_year_idx").on(t.academicYearId),
    unitYearIdx: index("classes_unit_year_idx").on(t.unitId, t.academicYearId),
  }),
);
```

#### Enrollments (Academic Status Layer)

```typescript
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "promoted",
  "graduated",
  "transferred_out",
  "inactive",
]);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    studentId: uuid("student_id")
      .references(() => students.id)
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    status: enrollmentStatusEnum("status").default("active").notNull(),
    transferDestination: varchar("transfer_destination", { length: 255 }),
    graduationDate: date("graduation_date"),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  },
  (t) => ({
    // KEPUTUSAN: Satu enrollment per siswa per tahun ajaran (lihat Appendix C, C6)
    studentYearUnique: uniqueIndex("enrollments_student_year_unique").on(
      t.studentId,
      t.academicYearId,
    ),
    classIdx: index("enrollments_class_idx").on(t.classId),
    statusIdx: index("enrollments_status_idx").on(t.status),
  }),
);

export const enrollmentStatusHistory = pgTable("enrollment_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id")
    .references(() => enrollments.id)
    .notNull(),
  fromStatus: enrollmentStatusEnum("from_status").notNull(),
  toStatus: enrollmentStatusEnum("to_status").notNull(),
  changedBy: varchar("changed_by", { length: 255 }).notNull(), // clerkUserId
  reason: text("reason"),
  metadata: jsonb("metadata"), // { destinationSchool, graduationDate, newClassId }
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});
```

#### SPP Tables

```typescript
export const paymentCategories = pgTable("payment_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => schoolUnits.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  period: varchar("period", { length: 20 }).notNull(), // monthly, annual, one_time
  defaultAmount: numeric("default_amount", { precision: 15, scale: 2 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classPaymentRates = pgTable(
  "class_payment_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    classId: uuid("class_id")
      .references(() => classes.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => paymentCategories.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  },
  (t) => ({
    classRateUnique: uniqueIndex("class_payment_rates_unique").on(
      t.classId,
      t.categoryId,
      t.academicYearId,
    ),
  }),
);

export const discountSchemes = pgTable("discount_schemes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  categoryId: uuid("category_id").references(() => paymentCategories.id), // null = semua kategori
  academicYearId: uuid("academic_year_id")
    .references(() => academicYears.id)
    .notNull(),
  discountType: varchar("discount_type", { length: 10 }).notNull(), // percent, fixed
  discountValue: numeric("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  reason: varchar("reason", { length: 255 }),
  isLocked: boolean("is_locked").default(false).notNull(), // true setelah tahun ajaran aktif
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// KEPUTUSAN (C5): billing_month disimpan sebagai VARCHAR(7) format "YYYY-MM"
// Dilengkapi dengan CHECK constraint regex untuk divalidasi oleh database.
export const paymentBillStatusEnum = pgEnum("payment_bill_status", [
  "active",
  "cancelled",
]);

export const paymentBills = pgTable(
  "payment_bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    enrollmentId: uuid("enrollment_id")
      .references(() => enrollments.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => paymentCategories.id)
      .notNull(),
    billingMonth: varchar("billing_month", { length: 7 }).notNull(), // "2024-07"
    baseAmount: numeric("base_amount", { precision: 15, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    netAmount: numeric("net_amount", { precision: 15, scale: 2 }).notNull(),
    status: paymentBillStatusEnum("status").default("active").notNull(), // cancelled jika salah generate
  },
  (t) => ({
    billUnique: uniqueIndex("payment_bills_unique").on(
      t.enrollmentId,
      t.categoryId,
      t.billingMonth,
    ),
    enrollmentIdx: index("payment_bills_enrollment_idx").on(t.enrollmentId),
    billingMonthCheck: check(
      "billing_month_check",
      sql`billing_month ~ '^\\d{4}-(0[1-9]|1[0-2])$'`,
    ),
  }),
);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "payment",
  "reversal",
  "adjustment",
  "overpayment",
]);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    billId: uuid("bill_id")
      .references(() => paymentBills.id)
      .notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: varchar("payment_method", { length: 30 }), // cash, transfer, qris
    notes: text("notes"),
    reversedById: uuid("reversed_by_id").references(
      (): AnyPgColumn => paymentTransactions.id,
    ), // FK ke diri sendiri untuk reversal
    recordedBy: varchar("recorded_by", { length: 255 }).notNull(), // clerkUserId
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // CATATAN: Tidak ada updated_at — tabel ini append-only
  },
  (t) => ({
    billIdx: index("payment_transactions_bill_idx").on(t.billId),
  }),
);
```

#### Cashflow Tables

```typescript
export const cashflowCategories = pgTable("cashflow_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => schoolUnits.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // income, expense
  isActive: boolean("is_active").default(true).notNull(),
});

export const cashflowTransactions = pgTable(
  "cashflow_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    categoryId: uuid("category_id")
      .references(() => cashflowCategories.id)
      .notNull(),
    type: varchar("type", { length: 10 }).notNull(), // income, expense
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    transactionDate: date("transaction_date").notNull(),
    description: text("description"),
    paymentMethod: varchar("payment_method", { length: 30 }),
    referenceNumber: varchar("reference_number", { length: 100 }),
    sppPaymentId: uuid("spp_payment_id").references(
      () => paymentTransactions.id,
    ), // auto-link opsional
    recordedBy: varchar("recorded_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    unitYearIdx: index("cashflow_transactions_unit_year_idx").on(
      t.unitId,
      t.academicYearId,
    ),
    dateIdx: index("cashflow_transactions_date_idx").on(t.transactionDate),
  }),
);
```

#### School Events

```typescript
export const eventCategoryEnum = pgEnum("event_category", [
  "lomba",
  "kegiatan_rutin",
  "rapat",
  "libur",
  "lainnya",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "scheduled",
  "ongoing",
  "completed",
  "cancelled",
]);

export const schoolEvents = pgTable(
  "school_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id")
      .references(() => schoolUnits.id)
      .notNull(),
    academicYearId: uuid("academic_year_id")
      .references(() => academicYears.id)
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: eventCategoryEnum("category").notNull(),
    startDate: date("start_date"), // nullable = tanpa tanggal
    endDate: date("end_date"),
    location: varchar("location", { length: 255 }),
    description: text("description"),
    status: eventStatusEnum("status").default("scheduled").notNull(),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unitYearIdx: index("school_events_unit_year_idx").on(
      t.unitId,
      t.academicYearId,
    ),
    startDateIdx: index("school_events_start_date_idx").on(t.startDate),
  }),
);
```

#### Users & RBAC

```typescript
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "kepala_sekolah",
  "admin_tu",
  "bendahara",
]);

export const userSchoolAssignments = pgTable(
  "user_school_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id").references(() => schoolUnits.id), // null = school-wide (super_admin)
    role: userRoleEnum("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (t) => ({
    clerkUserIdx: index("user_assignments_clerk_idx").on(t.clerkUserId),
    uniqueAssignment: uniqueIndex("user_assignment_unique").on(
      t.clerkUserId,
      t.schoolId,
      t.unitId,
    ),
  }),
);
```

#### Activity Logs

```typescript
// KEPUTUSAN (C1): Ditulis otomatis oleh activityLogMiddleware, bukan per-prosedur manual
// KEPUTUSAN (C8): Tidak ada auto-deletion untuk MVP; disimpan selamanya
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    unitId: uuid("unit_id").references(() => schoolUnits.id),
    actorId: varchar("actor_id", { length: 255 }).notNull(), // clerkUserId
    actorName: varchar("actor_name", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(), // contoh: "student.created"
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id"),
    description: text("description").notNull(), // human-readable Bahasa Indonesia
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    unitIdx: index("activity_logs_unit_idx").on(t.unitId),
    createdAtIdx: index("activity_logs_created_at_idx").on(t.createdAt),
  }),
);
```

### 4.2 Row-Level Security Policies

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON students
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY unit_isolation ON students
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );
```

```typescript
// server/db/middleware.ts
export async function withRLSContext(
  schoolId: string,
  unitId: string,
  role: string,
) {
  await db.execute(sql`
    SELECT
      set_config('app.current_school', ${schoolId}, true),
      set_config('app.current_unit', ${unitId}, true),
      set_config('app.user_role', ${role}, true)
  `);
}
```

### 4.3 Database Indexes Strategy

**Composite indexes di semua tabel tenant-scoped:** `(school_id, unit_id)` pada setiap tabel memastikan query isolasi tenant cepat bahkan pada skala besar.

**Academic year scoped queries:** `(unit_id, academic_year_id)` pada classes, enrollments, payment_bills — pola query paling sering.

**Payment status computation:** `(bill_id)` pada `payment_transactions` mempercepat query agregat status pembayaran.

**Activity logs:** `(unit_id)` dan `(created_at)` untuk query dashboard feed kronologis.

---

## 5. API Specifications

### 5.1 oRPC Router Structure

```typescript
export const appRouter = router({
  auth: authRouter,
  schools: schoolsRouter,
  academicYears: academicYearsRouter,
  teachers: teachersRouter,
  classes: classesRouter,
  students: studentsRouter,
  spp: sppRouter,
  cashflow: cashflowRouter,
  events: eventsRouter,
  dashboard: dashboardRouter,
  reports: reportsRouter,
  jobs: jobsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
```

### 5.2 Activity Log Middleware (Centralized)

```typescript
// server/middleware/activity-log.ts
// Digunakan sebagai wrapper di setiap .mutation() call

interface ActivityLogConfig {
  action: string;           // contoh: "teacher.created"
  entityType: string;       // contoh: "teacher"
  getEntityId: (result: unknown) => string | null;
  buildDescription: (input: unknown, result: unknown, context: TenantContext) => string;
}

export const withActivityLog = (config: ActivityLogConfig) =>
  middleware(async ({ context, next, input }) => {
    const result = await next();
    if (result.ok) {
      const entityId = config.getEntityId(result.value);
      await db.insert(activityLogs).values({
        schoolId: context.schoolId,
        unitId: context.unitId,
        actorId: context.userId,
        actorName: context.actorName,
        action: config.action,
        entityType: config.entityType,
        entityId: entityId ?? undefined,
        description: config.buildDescription(input, result.value, context),
      });
    }
    return result;
  });

// Contoh penggunaan:
create: procedure
  .use(requireUnitContext)
  .use(requireRole(['super_admin', 'admin_tu']))
  .use(withActivityLog({
    action: 'teacher.created',
    entityType: 'teacher',
    getEntityId: (r) => (r as Teacher).id,
    buildDescription: (_, r, ctx) => `${ctx.actorName} menambahkan guru ${(r as Teacher).namaLengkap}`,
  }))
  .input(teacherCreateSchema)
  .mutation(async ({ input, context }) => { /* ... */ }),
```

### 5.3 Key Procedures by Domain

#### Teachers Router (representatif)

```typescript
export const teachersRouter = router({
  list: procedure
    .use(requireUnitContext)
    .use(
      requireRole(["super_admin", "kepala_sekolah", "admin_tu", "bendahara"]),
    )
    .input(
      z.object({
        search: z.string().optional(),
        statusKepegawaian: z.enum(["tetap", "honorer", "gtt"]).optional(),
        isActive: z.boolean().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      }),
    )
    .query(async ({ input, context }) => {
      const where = and(
        eq(teachers.unitId, context.unitId),
        input.search
          ? or(
              ilike(teachers.namaLengkap, `%${input.search}%`),
              ilike(teachers.nik, `%${input.search}%`),
            )
          : undefined,
        input.statusKepegawaian
          ? eq(teachers.statusKepegawaian, input.statusKepegawaian)
          : undefined,
        input.isActive !== undefined
          ? eq(teachers.isActive, input.isActive)
          : undefined,
      );
      const [data, total] = await Promise.all([
        db.query.teachers.findMany({
          where,
          limit: input.pageSize,
          offset: (input.page - 1) * input.pageSize,
        }),
        db.select({ count: count() }).from(teachers).where(where),
      ]);
      return {
        data,
        total: total[0].count,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  importExecute: procedure
    .use(requireUnitContext)
    .use(requireRole(["super_admin", "admin_tu"]))
    .input(z.object({ rows: z.array(teacherImportRowSchema) }))
    .mutation(async ({ input, context }) => {
      // KEPUTUSAN (C3): pg-boss berjalan di proses yang sama
      const jobId = await pgBoss.send("bulk-import-teachers", {
        rows: input.rows,
        schoolId: context.schoolId,
        unitId: context.unitId,
        actorId: context.userId,
      });
      return { jobId };
    }),
});
```

#### SPP Router (recordPayment)

```typescript
recordPayment: procedure
  .use(requireUnitContext)
  .use(requireRole(['super_admin', 'bendahara']))
  .use(withActivityLog({
    action: 'spp.payment.recorded',
    entityType: 'payment_transaction',
    getEntityId: (r) => (r as { transactionId: string }).transactionId,
    buildDescription: (input: any, _, ctx) => `${ctx.actorName} mencatat pembayaran SPP`,
  }))
  .input(z.object({
    billId: z.string().uuid(),
    amountPaid: z.number().positive(),
    paymentDate: z.string().date(),
    paymentMethod: z.enum(['cash', 'transfer', 'qris']),
    notes: z.string().optional(),
  }))
  .mutation(async ({ input, context }) => {
    const bill = await db.query.paymentBills.findFirst({ where: eq(paymentBills.id, input.billId) });
    if (!bill || bill.status === 'cancelled') throw new ORPCError({ code: 'NOT_FOUND' });

    const [{ terbayar }] = await db.select({ terbayar: sum(paymentTransactions.amount) })
      .from(paymentTransactions)
      .where(and(eq(paymentTransactions.billId, input.billId), eq(paymentTransactions.transactionType, 'payment')));

    const remaining = Number(bill.netAmount) - (Number(terbayar) || 0);
    const isOverpayment = input.amountPaid > remaining;

    let transactionId: string;
    await db.transaction(async (tx) => {
      const [transaction] = await tx.insert(paymentTransactions).values({
        billId: input.billId,
        schoolId: context.schoolId,
        amount: isOverpayment ? remaining.toString() : input.amountPaid.toString(),
        transactionType: 'payment',
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
        recordedBy: context.userId,
      }).returning();
      transactionId = transaction.id;

      if (isOverpayment) {
        await tx.insert(paymentTransactions).values({
          billId: input.billId,
          schoolId: context.schoolId,
          amount: (input.amountPaid - remaining).toString(),
          transactionType: 'overpayment',
          paymentDate: input.paymentDate,
          paymentMethod: input.paymentMethod,
          notes: `Kelebihan bayar dari transaksi ${transaction.id}`,
          recordedBy: context.userId,
        });
      }

      await tx.insert(cashflowTransactions).values({
        schoolId: context.schoolId,
        unitId: context.unitId,
        academicYearId: context.activeAcademicYearId,
        categoryId: await getOrCreateSPPCashflowCategory(tx, context.unitId),
        type: 'income',
        amount: input.amountPaid.toString(),
        transactionDate: input.paymentDate,
        description: `Pembayaran SPP${input.notes ? ` - ${input.notes}` : ''}`,
        sppPaymentId: transaction.id,
        recordedBy: context.userId,
      });
    });

    return { success: true, transactionId: transactionId!, isOverpayment, overpaymentAmount: isOverpayment ? input.amountPaid - remaining : 0 };
  }),
```

### 5.4 Request/Response Standards

Semua oRPC procedures:

- Input divalidasi dengan Zod (schema yang sama di-share antara client dan server)
- Auth diterapkan via middleware stack: `ClerkAuth → requireUnitContext → requireRole → withActivityLog`
- Error menggunakan `ORPCError` dengan kode standar: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `UNPROCESSABLE_ENTITY`, `INTERNAL_SERVER_ERROR`
- Respons list terpaginasi: `{ data: T[], total: number, page: number, pageSize: number }`

---

## 6. Security & Privacy

### 6.1 Authentication & Authorization

**Clerk Session Flow:**

1. User mengautentikasi via halaman login Clerk yang di-embed
2. Clerk menerbitkan JWT short-lived (15 menit) + refresh token (7 hari)
3. JWT mengandung custom claims: `{ schoolId, activeUnitId, role }` dari `user.publicMetadata`
4. Setiap oRPC request membawa JWT di header `Authorization: Bearer <token>`
5. Server memvalidasi JWT via Clerk SDK; menolak token expired/invalid dengan 401
6. Saat unit switch: Clerk token di-refresh dengan claim `activeUnitId` baru

### 6.2 Data Security

**Enkripsi saat tersimpan:** Neon PostgreSQL mengenkripsi data at rest secara default (AES-256).

**Enkripsi saat transit:** Semua komunikasi via HTTPS/TLS 1.3. Koneksi Neon menggunakan SSL by default.

**Financial Data Immutability:**

```sql
REVOKE UPDATE, DELETE ON payment_transactions FROM edara_app;
```

**PII Handling:** NIK dan NISN siswa hanya dapat diakses oleh `super_admin` dan `admin_tu`. `bendahara` dan `kepala_sekolah` melihat versi masked di view tertentu.

### 6.3 OWASP Top 10 Mitigations

| Risk                           | Mitigation                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------- |
| A01: Broken Access Control     | RLS di DB layer + RBAC di oRPC middleware + route guards TanStack Router      |
| A02: Cryptographic Failures    | Semua data transit via HTTPS; financial records di-enkripsi at rest oleh Neon |
| A03: Injection                 | Drizzle ORM parameterized queries; tidak ada interpolasi string mentah di SQL |
| A04: Insecure Design           | Append-only transactions; computed status tidak pernah disimpan               |
| A05: Security Misconfiguration | Environment variables untuk semua secrets; tidak ada hardcoded credentials    |
| A07: Auth Failures             | Clerk managed auth; JWT expiry; refresh token rotation                        |
| A08: Software Integrity        | pnpm lock file; Vitest tests untuk critical business logic                    |
| A09: Logging Failures          | `activity_logs` menangkap semua mutations pada entitas sensitif               |

### 6.4 Financial Data Integrity

## Seluruh komputasi operasional keuangan pada Service Layer WAJIB menggunakan pustaka **`decimal.js`**. Penggunaan tipe data primitif JS (`Number`, `parseInt`, `parseFloat`) serta _native floating point arithmetics_ (`+`, `-`) sama sekali tidak diizinkan. Tipe di PostgreSQL menggunakan `numeric(...)` yang akan dilanjutkan ke JavaScript runtime sebagai nilai _string_. Menggunakan `decimal.js` akan mencegah _floating-point error_ maupun kehilangan presisi yang biasanya berakhir menjadi _silent bugs_.

## 7. User Interface Specifications

### 7.1 Design Philosophy

**Prinsip Utama:**

- Content-first layouts yang memprioritaskan penyelesaian tugas di atas elemen dekoratif
- Negative space yang dikalibrasi untuk ruang berpikir kognitif dan prioritisasi konten
- Typography hierarchy yang memanfaatkan variasi bobot dan skala proporsional
- Motion choreography dengan transisi berbasis fisika untuk kesinambungan spasial
- Rasio kontras berbasis WCAG AA dipasangkan dengan pola navigasi intuitif

**Anti-Patterns yang Dilarang:**

- Tipografi generik: Inter, Roboto, Arial, system fonts
- Color scheme klise: purple gradients pada background putih
- Layout yang dapat diprediksi dan cookie-cutter
- Decorative animation yang tidak mengomunikasikan state sistem

**Kanonikal:** Forest Green AMOLED dark mode sebagai tampilan utama yang dipromosikan di marketing; light mode tersedia sebagai preferensi pengguna.

### 7.2 Design Foundations

#### 7.2.1 Color System

**Light Mode (`:root`):**

```css
:root {
  /* Brand — Forest */
  --color-brand: #008236; /* Deep Emerald Green — Primary buttons, active sidebar */
  --color-brand-hover: #016630; /* Button hover */
  --color-brand-active: #01552a; /* Button active/pressed */
  --color-brand-subtle: #f0fdf4; /* Mint Wash — surface */
  --color-brand-muted: #7bf1a8; /* Mint Light */

  /* Accent — Amber */
  --color-accent: #d97706; /* Amber 500 — Partial payment, highlight */
  --color-accent-hover: #b45309; /* Amber 600 — Accent hover */
  --color-accent-subtle: #fef3c7; /* Amber 50 — Warning badge bg */

  /* Semantic */
  --color-success: #008236;
  --color-success-subtle: #f0fdf4;
  --color-error: #e7000b; /* Vivid Red */
  --color-error-subtle: #fff1f2;
  --color-warning: #f59e0b;
  --color-warning-subtle: #fffbeb;
  --color-info: #3b82f6;
  --color-info-subtle: #eff6ff;

  /* Surface */
  --color-bg: #ffffff; /* App background */
  --color-bg-subtle: #fafafa; /* Sidebar/off-white */
  --color-surface: #ffffff; /* Cards, modals */
  --color-border: #e5e5e5; /* Light Border Gray */
  --color-border-subtle: #f0f0f0;

  /* Text */
  --color-text-primary: #0a0a0a; /* Rich Charcoal */
  --color-text-secondary: #737373; /* Neutral Gray */
  --color-text-tertiary: #a1a1a1;
  --color-text-disabled: #d4d4d4;
  --color-text-inverse: #ffffff;
}
```

**Dark Mode (`.dark`) — AMOLED Canonical:**

```css
.dark {
  /* AMOLED canvas */
  --color-bg: #0a0a0a; /* Rich Charcoal Canvas */
  --color-surface: #171717; /* Dark Card Surface */
  --color-surface-raised: #27272a; /* Dark Secondary */
  --color-border: rgba(255, 255, 255, 0.1);

  /* Brand DM */
  --color-brand: #008236;
  --color-brand-hover: #016630;
  --color-brand-subtle: #262626; /* Dark Muted */
  --color-brand-muted: #171717;

  /* Accent DM */
  --color-accent: #f59e0b;
  --color-accent-subtle: #2a2010;

  /* Text DM */
  --color-text-primary: #fafafa;
  --color-text-secondary: #a1a1a1;
  --color-text-tertiary: #737373;
}
```

**Chart Color Palette:**

| Token   | Light     | Dark      | Penggunaan                  |
| ------- | --------- | --------- | --------------------------- |
| Chart 1 | `#008236` | `#008236` | Primary series (pemasukan)  |
| Chart 2 | `#00A63E` | `#4ADE80` | Secondary series            |
| Chart 3 | `#7BF1A8` | `#2D7452` | Tertiary                    |
| Chart 4 | `#F4F4F5` | `#171717` | Muted/background            |
| Chart 5 | `#F59E0B` | `#F59E0B` | Accent series (pengeluaran) |
| Chart 6 | `#D97706` | `#FFB020` | Highlight                   |
| Chart 7 | `#737373` | `#A1A1A1` | Neutral                     |
| Chart 8 | `#E5E5E5` | `#27272A` | Disabled/reference          |

**Status Colors (Functional):**

| Status              | Light BG  | Light Text | Light Border | Dark BG   | Dark Text |
| ------------------- | --------- | ---------- | ------------ | --------- | --------- |
| Lunas/Aktif         | `#F0FDF4` | `#008236`  | `#D1FAE5`    | `#064E3B` | `#34D399` |
| Menunggak/Bahaya    | `#FFF1F2` | `#E7000B`  | `#FECDD3`    | `#450A0A` | `#F87171` |
| Sebagian/Peringatan | `#FFFBEB` | `#B45309`  | `#FEF3C7`    | `#451A03` | `#FBBF24` |
| Nonaktif/Netral     | `#F5F5F5` | `#404040`  | `#E5E5E5`    | `#171717` | `#737373` |
| Info/Subsidi        | `#EFF6FF` | `#1D4ED8`  | `#DBEAFE`    | `#1E3A8A` | `#60A5FA` |

#### 7.2.2 Typography

**Font Families:**

- **Primary:** `Geist` — `--font-sans` — Semua UI text, body, label, tombol
- **Monospace:** `Geist Mono` — `--font-mono` — NIS/NIK/NISN, kode transaksi, nominal uang, ID, timestamps

```css
--font-sans: "Geist", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "Geist Mono", "SF Mono", "Fira Code", monospace;
```

**Font Weights:**

| Token    | Value | Penggunaan                 |
| -------- | ----- | -------------------------- |
| Light    | 300   | Deskripsi panjang, subtext |
| Regular  | 400   | Body text standar          |
| Medium   | 500   | Label, tombol, badge       |
| Semibold | 600   | Card title, section header |
| Bold     | 700   | Heading, angka KPI         |

**Text Scale:**

| Style      | Size | Weight | Tracking | Penggunaan                         |
| ---------- | ---- | ------ | -------- | ---------------------------------- |
| Display    | 32px | 700    | -0.04em  | Dashboard hero, onboarding         |
| H1         | 24px | 700    | -0.03em  | Page heading                       |
| H2         | 18px | 600    | -0.02em  | Widget title, modal heading        |
| H3         | 15px | 600    | -0.01em  | Card title, section subheader      |
| H4         | 13px | 600    | -0.01em  | Tab label aktif                    |
| Body Large | 16px | 400    | 0        | Long-form description, Reading     |
| Body       | 14px | 400    | 0        | Default UI, Buttons, Table cells   |
| Body Small | 12px | 400    | 0        | Supporting text, Labels            |
| Label      | 13px | 500    | 0        | Form field labels, Column headers  |
| Caption    | 11px | 500    | 0.04em   | Timestamps, meta (uppercase)       |
| Mono Data  | 12px | 400    | 0        | NIS, nominal uang, ID (Geist Mono) |
| Stat/KPI   | 28px | 700    | -0.05em  | Dashboard stat cards               |

#### 7.2.3 Spacing System

```css
--space-1: 4px; /* Micro — gap ikon + teks kecil */
--space-2: 8px; /* XSmall — padding internal badge */
--space-3: 12px; /* Small — padding kartu kecil */
--space-4: 16px; /* Default — padding kartu standar, cell tabel */
--space-5: 20px; /* Medium-SM — padding horizontal topbar kecil */
--space-6: 24px; /* Medium — padding kartu besar, jarak antar section */
--space-8: 32px; /* Large — jarak antar widget dashboard */
--space-10: 40px; /* XLarge — margin vertikal section utama */
--space-12: 48px; /* 2XLarge — padding atas halaman */
--space-16: 64px; /* 3XLarge — jarak antar section besar */
```

#### 7.2.4 Border Radius & Shadows

```css
--radius-sm: 4px; /* Badge role, micro elements */
--radius-md: 6px; /* Button, input (component level) */
--radius-lg: 8.5px; /* Base radius for Cards, Panels */
--radius-xl: 12px; /* Modal, side drawer */
--radius-full: 9999px; /* Badge status, avatar */

--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.07), 0 4px 8px rgba(0, 0, 0, 0.04);
```

#### 7.2.5 Motion & Animation

```css
--ease-out: cubic-bezier(
  0.16,
  1,
  0.3,
  1
); /* Default masuk — deselerasi cepat */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* Default keluar */
--ease-inout: cubic-bezier(0.45, 0, 0.55, 1); /* Symmetric — tab switch */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy — toggle, popover */

--duration-fast: 120ms; /* Hover state, focus ring, tooltip */
--duration-base: 200ms; /* Button, input, tab — default */
--duration-slow: 300ms; /* Modal open, drawer slide */
```

**Animasi per Komponen:**

| Komponen         | Durasi | Easing          | Properti                     |
| ---------------- | ------ | --------------- | ---------------------------- |
| Button hover     | 200ms  | ease-out        | background, shadow           |
| Input focus      | 120ms  | ease-out        | border-color, box-shadow     |
| Tab switch       | 200ms  | ease-inout      | color, border-color          |
| Switch/Toggle    | 200ms  | ease-spring     | transform (thumb)            |
| Modal open       | 300ms  | ease-out        | opacity + scale(0.96→1)      |
| Side drawer      | 300ms  | ease-out        | translateX                   |
| Toast            | 250ms  | ease-out        | translateY + opacity         |
| Page transition  | 200ms  | ease-out        | opacity + translateY(12px→0) |
| Skeleton shimmer | 1.5s   | linear infinite | background-position          |
| Bulk bar appear  | 250ms  | ease-spring     | translateY + opacity         |

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 7.3 Component Specifications

#### 7.3.1 Buttons

**Variants:**

| Variant       | Background  | Text    | Border      | Penggunaan            |
| ------------- | ----------- | ------- | ----------- | --------------------- |
| Primary       | #008236     | #FFFFFF | —           | Aksi utama, CTA       |
| Secondary     | #FFFFFF     | #0A0A0A | 1px #E5E5E5 | Aksi sekunder         |
| Ghost         | transparent | #737373 | —           | Aksi tersier, toolbar |
| Destructive   | #E7000B     | #FFFFFF | —           | Hapus, aksi berbahaya |
| Outline Brand | transparent | #008236 | 1px #008236 | Aksi brand tanpa fill |
| Accent        | #F59E0B     | #FFFFFF | —           | Highlight action      |
| Link          | transparent | #008236 | —           | Inline link text      |
| Icon          | #FFFFFF     | #0A0A0A | 1px #E5E5E5 | Tombol ikon saja      |

**Sizes:**

| Size    | Height  | Padding | Font Size |
| ------- | ------- | ------- | --------- |
| SM      | 32px    | 0 10px  | 12px      |
| MD      | 36px    | 0 12px  | 14px      |
| LG      | 40px    | 0 16px  | 14px      |
| Icon SM | 32×32px | 0       | —         |
| Icon MD | 36×36px | 0       | —         |
| Icon LG | 40×40px | 0       | —         |

**Spec:**

- Border Radius: 6px (`--radius-md`)
- Font Weight: 500
- Transition: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- Focus Ring: 0 0 0 2px bg, 0 0 0 4px #008236
- Disabled: opacity 40%, pointer-events: none
- Icon gap: 6px antara ikon dan label

#### 7.3.2 Cards

- Background: #FFFFFF (light) / #343434 (dark)
- Border: 1px solid #E5E5E5 / 1px solid rgba(255,255,255,0.10)
- Border Radius: 8px (`--radius-lg`)
- Shadow: `--shadow-xs`
- Padding SM: 12px | MD: 16px | LG: 24px

**Stat Card Anatomy:**

- Label: 12px / 400 / `#525252`
- Value/KPI: 24–28px / 700 / `letter-spacing: -0.04em`
- Trend: 12px / 500; Forest (naik) atau merah (turun) + ikon chevron
- Progress bar: tinggi 5px, radius full; warna mengikuti semantik
- Icon container: 32×32px, background subtle sesuai semantik, border-radius `--radius-md`

#### 7.3.3 Inputs & Forms

**Input:**

- Height: 36px
- Padding: 0 12px
- Border: 1px solid #E5E5E5; Focus: #008236
- Border Radius: 6px
- Font Size: 13px / 400
- Placeholder: `#737373`
- Focus Ring: `0 0 0 3px rgba(0,130,54,0.10)`
- Error Border: `#E7000B`; Error Ring: `0 0 0 3px rgba(231,0,11,0.08)`
- Disabled: opacity 50%, background `#F5F5F5`
- Transition: `120ms cubic-bezier(0.16, 1, 0.3, 1)`

**Textarea:** Min Height 80px; Padding `8px 12px`; Resize: vertical only.

**Form Controls:**

| Komponen      | Size                 | Active Color                     |
| ------------- | -------------------- | -------------------------------- |
| Toggle/Switch | 34×18px, thumb 14px  | `#008236`                        |
| Checkbox      | 14×14px, radius 3px  | `#008236` fill + white checkmark |
| Radio         | 14×14px, radius full | `#008236` inner dot 6px          |

**Labels & Messages:**

- Label: 12px / 500 / `#525252`, margin-bottom 4px
- Required asterisk: `*` merah `#E7000B`, margin-left 2px
- Hint: 11px / 400 / `#737373`, margin-top 4px
- Error: 11px / 400 / `#E7000B`, margin-top 4px

#### 7.3.4 Badges

**Spec:** Padding `3px 7px`; Font 11px / 500; Border Radius full (status) atau 4px (role); Dot 5×5px.

**Status Badges (dengan dot):**

| Variant      | Background | Text      | Border    | Dot       |
| ------------ | ---------- | --------- | --------- | --------- |
| Aktif        | `#F0FDF4`  | `#008236` | `#D4EDE0` | `#008236` |
| Nonaktif     | `#FFF1F2`  | `#E7000B` | `#FECDD3` | `#E7000B` |
| Dalam Proses | `#FFFBEB`  | `#F59E0B` | `#FDE68A` | `#F59E0B` |
| Menunggu     | `#EFF6FF`  | `#3B82F6` | `#BFDBFE` | `#3B82F6` |
| Arsip        | `#F5F5F5`  | `#737373` | `#E5E5E5` | `#737373` |

**SPP Payment Status Badges:**

| Variant       | Background | Text      | Border    | Dot       |
| ------------- | ---------- | --------- | --------- | --------- |
| Lunas         | `#F0FDF4`  | `#008236` | `#D4EDE0` | `#008236` |
| Sebagian      | `#FFFBEB`  | `#F59E0B` | `#FDE68A` | `#F59E0B` |
| Belum Bayar   | `#FFF1F2`  | `#E7000B` | `#FECDD3` | `#E7000B` |
| Subsidi/Bebas | `#EFF6FF`  | `#3B82F6` | `#BFDBFE` | `#3B82F6` |

**Role Badges (solid, radius 4px):**

| Variant        | Background | Text      |
| -------------- | ---------- | --------- |
| Super Admin    | `#0A0A0A`  | `#FFFFFF` |
| Kepala Sekolah | `#008236`  | `#FFFFFF` |
| Bendahara      | `#7C3AED`  | `#FFFFFF` |
| Admin/TU       | `#0A0A0A`  | `#FFFFFF` |

**Event Category Badges:**

| Variant        | Background | Text      | Border    |
| -------------- | ---------- | --------- | --------- |
| Akademik/Rutin | `#EEF7F2`  | `#245C42` | `#A5D6B8` |
| Lomba          | `#EFF6FF`  | `#2563EB` | `#BFDBFE` |
| Rapat          | `#FFFBEB`  | `#D97706` | `#FDE68A` |
| Umum           | `#F5F5F5`  | `#525252` | `#E5E5E5` |
| Libur          | `#FFF1F2`  | `#E7000B` | `#FECDD3` |

#### 7.3.5 Tables

| Property           | Value                                          |
| ------------------ | ---------------------------------------------- |
| Header Height      | 32px                                           |
| Row Height         | 44px                                           |
| Cell Padding       | `8px 12px`                                     |
| Header Font        | 11px / 500 / uppercase / letter-spacing 0.04em |
| Header Background  | `#F5F5F5`                                      |
| Row Hover          | `#FAFAFA`                                      |
| Row Divider        | `1px solid #F0F0F0`                            |
| Default Pagination | 20 baris/halaman (opsi 50/100)                 |
| Sticky Column      | Nama — pin kiri                                |

**Row Action:** Tombol `···` kolom paling kanan → popover: Lihat Detail / Edit / Hapus. Popover menutup otomatis saat klik di luar.

**Bulk Action Bar (Floating):**

- Posisi: fixed bottom screen; z-index tinggi
- Background: `#171717`; text putih; padding `8px 16px`; border-radius 8px
- Konten: jumlah baris dipilih (mono chip) + action buttons kontekstual + "Batalkan Seleksi"
- Action button: background `rgba(255,255,255,0.10)`, border `rgba(255,255,255,0.15)`
- Animasi: 250ms slide-up + fade dari bawah

**Skeleton Loader:**

- Border radius 4px; animasi shimmer gradient horizontal 1.5s infinite
- Gradient: `#F5F5F5 → #E5E5E5 → #F5F5F5`

#### 7.3.6 Tabs (Line Variant)

- Padding: `8px 16px`
- Font: 13px / 500 (default) / 600 (active)
- Default Color: `#525252`; Active: `#0A0A0A`
- Active Border: `2px solid #0A0A0A`, bottom, offset -1px
- Container Border: `1px solid #E5E5E5` di bawah tab list
- Transition: 200ms ease-inout

**Tab Count Chip:** Geist Mono 10px; background `#F5F5F5`, border `1px #E5E5E5`; aktif: `#0A0A0A` bg, white text; padding `0 5px`, radius full, min-width 18px.

#### 7.3.7 Icons (Lucide React)

**Sizes:**

| Size | Dimensi | Penggunaan               |
| ---- | ------- | ------------------------ |
| XS   | 12×12px | Inline teks, badge dot   |
| SM   | 14×14px | Button icon, badge icon  |
| MD   | 16×16px | Default UI, form field   |
| LG   | 20×20px | Sidebar navigation       |
| XL   | 24×24px | Empty state, widget icon |

**Stroke:** 1.75px (navigasi) / 2px (UI elements); Linecap: round; Linejoin: round.

**Colors:** Aktif `#008236` / Default `#0A0A0A` / Muted `#737373` / Inverse `#FFFFFF`.

#### 7.3.8 Navigation & Layout

**Sidebar:**

| State                    | Width |
| ------------------------ | ----- |
| Expanded (desktop)       | 256px |
| Collapsed icon (desktop) | 48px  |
| Mobile drawer            | 288px |

- Nav item height: 32px (default); padding `8px` (`p-2`)
- Group label: 12px / 500 / uppercase (Geist Mono for data units)
- Active item: background `rgba(13, 159, 110, 0.1)`, text `#008236`
- Border: `1px solid #E5E5E5` (kanan/right)

**Topbar:**

- Height: 52px
- Background: `#FFFFFF`; Border: `1px solid #E5E5E5` bawah
- Padding: `0 16px`

**Content Area:** Padding 24px; max-width tidak dibatasi; Dashboard grid: 4 kolom widget cards, 2 kolom section bawah.

**Mobile Sidebar Behavior:**

- Default: tersembunyi
- Toggle via hamburger di topbar kiri → floating panel dari kiri
- Overlay semi-transparan menggelapkan konten di belakang
- Tap di luar menutup; animasi slide-in dari kiri 250ms ease-out

#### 7.3.9 Miscellaneous Components

**Avatar:**

| Size | Dimensi | Font     |
| ---- | ------- | -------- |
| SM   | 24×24px | 10px/600 |
| MD   | 32×32px | 12px/600 |
| LG   | 40×40px | 14px/600 |

Border radius: full; Background: warna unik per user; Inisial: 2 huruf kapital.

**Tooltip:** Background `#171717`; text `#FFFFFF` / 11px / 500; padding `5px 10px`; radius 6px; shadow `--shadow-lg`; delay 300ms.

**Progress Bar:** Track height 5px; background `#E5E5E5`; radius full; fill: warna semantik; transition `width 0.6s ease-out`.

**Pagination:** Height 28px, min-width 28px; font 12px / 500; active: Forest bg + white; radius 6px; gap 4px.

**Empty State:**

- Layout: center, flex column, text-align center
- Icon container: 40×40px, `#F5F5F5` bg, `1px #E5E5E5` border, radius 8px
- Title: 13px / 600; Description: 12px / 400 / `#525252` / max-width 280px
- CTA: "Kembali" (secondary) + "Ke Beranda" (primary), gap 8px
- Border: `1px dashed #E5E5E5`, radius 12px; padding `48px 24px`
- TIDAK menampilkan tombol "Tambah Data" atau "Import"

### 7.4 Project Structure

```
src/
├── app/
│   ├── client.tsx              # Client entry point
│   ├── router.tsx              # Router config
│   └── ssr.tsx                 # SSR entry (Phase 2)
│
├── routes/
│   ├── __root.tsx              # Root layout (ThemeProvider, QueryProvider)
│   ├── index.tsx               # Redirect ke /dashboard
│   ├── sign-in.tsx             # Auth page (Clerk SignIn)
│   ├── _authenticated.tsx      # Auth layout wrapper
│   ├── _authenticated/
│   │   ├── dashboard.tsx
│   │   ├── teachers/
│   │   │   ├── index.tsx       # List page
│   │   │   └── $teacherId.tsx  # Detail page
│   │   ├── students/
│   │   │   ├── index.tsx
│   │   │   └── $studentId.tsx  # Profil + tabs
│   │   ├── classes/
│   │   │   └── index.tsx
│   │   ├── spp/
│   │   │   └── index.tsx       # Tabs: matrix, transactions, arrears, config
│   │   ├── cashflow/
│   │   │   └── index.tsx
│   │   ├── events/
│   │   │   └── index.tsx       # Tabs: list, calendar
│   │   ├── settings/
│   │   │   └── index.tsx
│   │   └── users/              # Super Admin only
│   │       └── index.tsx
│   └── unauthorized.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── sign-in-form.tsx
│   │   │   └── unit-selector-modal.tsx
│   │   └── hooks/use-auth.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── stat-cards.tsx
│   │   │   ├── cashflow-chart.tsx
│   │   │   ├── upcoming-events-panel.tsx
│   │   │   └── activity-feed.tsx
│   │   └── hooks/use-dashboard-data.ts
│   │
│   ├── teachers/
│   │   ├── components/
│   │   │   ├── teachers-table.tsx
│   │   │   ├── teacher-form-drawer.tsx
│   │   │   ├── teacher-import-dialog.tsx
│   │   │   └── teacher-columns.tsx
│   │   ├── hooks/use-teachers.ts
│   │   └── schema.ts
│   │
│   ├── students/
│   │   ├── components/
│   │   │   ├── students-table.tsx
│   │   │   ├── student-form-drawer.tsx
│   │   │   ├── student-profile/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── class-history-tab.tsx
│   │   │   │   ├── payment-history-tab.tsx
│   │   │   │   └── payment-scheme-tab.tsx
│   │   │   ├── status-change-dialogs/
│   │   │   │   ├── promote-dialog.tsx
│   │   │   │   ├── transfer-dialog.tsx
│   │   │   │   └── graduate-dialog.tsx
│   │   │   └── import-dialog.tsx
│   │   ├── hooks/use-students.ts
│   │   └── schema.ts
│   │
│   ├── classes/
│   │   ├── components/
│   │   │   ├── class-grid.tsx
│   │   │   ├── class-card.tsx
│   │   │   ├── class-form-drawer.tsx
│   │   │   └── promote-class-dialog.tsx
│   │   └── schema.ts
│   │
│   ├── spp/
│   │   ├── components/
│   │   │   ├── payment-matrix.tsx
│   │   │   ├── record-payment-dialog.tsx
│   │   │   ├── reversal-dialog.tsx
│   │   │   ├── arrears-table.tsx
│   │   │   ├── transactions-table.tsx
│   │   │   └── config/
│   │   │       ├── categories-table.tsx
│   │   │       ├── class-rates-matrix.tsx
│   │   │       └── discount-schemes-table.tsx
│   │   └── schema.ts
│   │
│   ├── cashflow/
│   │   ├── components/
│   │   │   ├── cashflow-summary.tsx
│   │   │   ├── cashflow-chart.tsx
│   │   │   ├── transactions-table.tsx
│   │   │   └── add-transaction-modal.tsx
│   │   └── schema.ts
│   │
│   └── events/
│       ├── components/
│       │   ├── events-table.tsx
│       │   ├── events-calendar.tsx
│       │   ├── event-form-drawer.tsx
│       │   └── events-summary-cards.tsx
│       └── schema.ts
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   │
│   ├── data-table/
│   │   ├── data-table-toolbar.tsx
│   │   ├── data-table-pagination.tsx
│   │   ├── data-table-column-header.tsx
│   │   ├── data-table-faceted-filter.tsx
│   │   ├── data-table-view-options.tsx
│   │   └── data-table-bulk-actions.tsx
│   │
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   ├── app-header.tsx
│   │   ├── main-content.tsx
│   │   └── skip-to-main.tsx
│   │
│   └── shared/
│       ├── page-header.tsx
│       ├── stat-card.tsx
│       ├── status-badge.tsx
│       ├── empty-state.tsx
│       ├── date-picker.tsx
│       ├── drop-zone.tsx
│       └── step-indicator.tsx
│
├── server/
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/
│   │   │   ├── index.ts
│   │   │   ├── schools.ts
│   │   │   ├── users.ts
│   │   │   ├── academic-years.ts
│   │   │   ├── teachers.ts
│   │   │   ├── students.ts
│   │   │   ├── classes.ts
│   │   │   ├── enrollments.ts
│   │   │   ├── spp.ts
│   │   │   ├── cashflow.ts
│   │   │   ├── events.ts
│   │   │   └── logs.ts
│   │   └── migrations/
│   │
│   ├── routers/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── schools.ts
│   │   ├── academic-years.ts
│   │   ├── teachers.ts
│   │   ├── students.ts
│   │   ├── classes.ts
│   │   ├── spp.ts
│   │   ├── cashflow.ts
│   │   ├── events.ts
│   │   ├── dashboard.ts
│   │   ├── reports.ts
│   │   └── users.ts
│   │
│   ├── middleware/
│   │   ├── auth.ts             # Clerk JWT validation
│   │   ├── rbac.ts             # Role guards
│   │   ├── rls.ts              # Set Postgres session variables
│   │   └── activity-log.ts    # withActivityLog middleware
│   │
│   └── jobs/
│       ├── index.ts            # pg-boss init + worker registration (COLOCATED)
│       ├── bulk-import-teachers.ts
│       ├── bulk-import-students.ts
│       ├── generate-bills.ts
│       ├── generate-excel-report.ts
│       └── generate-pdf-report.ts
│
├── stores/
│   ├── tenant-store.ts         # Active school + unit context
│   ├── auth-store.ts           # User info cache
│   └── ui-store.ts             # Sidebar state, theme
│
├── lib/
│   ├── orpc.ts                 # oRPC client setup
│   ├── utils.ts                # cn(), misc
│   ├── formatters.ts           # formatRupiah(), formatDate(), formatRelativeTime()
│   ├── constants.ts            # Status colors, enum display maps
│   └── validators/
│       ├── teacher.ts
│       ├── student.ts
│       ├── spp.ts
│       └── cashflow.ts
│
├── hooks/
│   ├── use-tenant.ts
│   ├── use-debounce.ts
│   └── use-media-query.ts
│
├── context/
│   └── theme-provider.tsx
│
└── styles/
    ├── theme.css               # CSS variables (root + dark)
    └── globals.css             # Tailwind imports + global styles
```

### 7.5 Key UX Flows

#### UX-01: Login → Dashboard

```
User → /sign-in
  → Input email + password
  → Clerk validates credentials
  → Clerk issues JWT dengan custom claims
  → TanStack Router beforeLoad checks JWT
  → Jika role = super_admin: redirect /dashboard (atau /unit-select jika >1 unit)
  → Jika user single unit: redirect /_authenticated/dashboard
  → Jika user multi-unit: redirect /_authenticated/unit-select
    → Halaman pemilih unit (bukan modal)
    → User pilih unit → Zustand update activeUnitId
    → Clerk refresh token dengan activeUnitId baru
    → Redirect ke dashboard
```

#### UX-02: Teacher Bulk Import

```
Klik "Import" → Dialog terbuka (Step Indicator 4 langkah)
  → Step 1: Unduh Template Excel + penjelasan format
  → Step 2: Drag-and-drop zone → file dipilih → parsing otomatis + spinner
  → Step 3: Preview — baris valid (putih) / baris error (merah muda + tooltip per kolom)
    → Counter: "248 valid · 7 error"
  → Klik "Import Valid Rows (248)"
  → orpc.teachers.importExecute → pg-boss enqueue → jobId dikembalikan
  → Step 4: Progress bar real-time (polling job status)
  → Selesai: "248 guru berhasil, 7 dilewati" + tombol "Unduh Log Error"
  → Dialog tutup → teachers list ter-invalidate
  → Toast: "248 guru berhasil diimport"
```

#### UX-03: Pencatatan Pembayaran SPP

```
"Catat Pembayaran SPP" → Dialog multi-step
  → Step 1: Search siswa autocomplete 300ms debounce
    → Pilih siswa → kartu info (foto, nama, kelas, status enrollment)
  → Step 2: Checkbox list periode belum/sebagian dibayar; multi-select; total real-time
  → Step 3: Input "Jumlah Dibayarkan"
    → Kalkulasi live: Tagihan Total / Dibayarkan / Kekurangan(merah)/Kelebihan(amber)
    → Jika overpayment: banner amber non-dismissible "Kelebihan Rp X — kembalikan ke wali"
  → Step 4: Tanggal + Metode (toggle card: Tunai/Transfer/QRIS) + Catatan opsional
  → Klik "Simpan Pembayaran"
  → Post-save: Receipt modal (nama, kelas, periode, jumlah, metode, ref)
    → Tombol "Cetak Kwitansi" (print browser) + "Selesai"
  → Payment matrix cell update; toast success
```

#### UX-04: Student Status Change — Mutasi Keluar

```
Student row → ··· → "Ubah Status" → "Mutasi Keluar"
  → Side drawer: "Proses Mutasi Keluar"
  → Form: Sekolah Tujuan*, Tanggal Mutasi*, Catatan
  → Warning banner: "Status tidak dapat dibatalkan otomatis"
  → "Konfirmasi Mutasi" (Destructive variant)
  → orpc.students.changeStatus({ status: 'transferred_out', metadata: { destinationSchool, date } })
  → enrollment.status → 'transferred_out'
  → enrollment_status_history INSERT
  → activity_logs INSERT (via middleware)
  → Student row badge berubah ke "Mutasi"
  → Toast: "Siswa [Nama] telah diproses mutasi keluar"
```

#### UX-05: Kenaikan Kelas Massal

```
Halaman Detail Kelas → "Kenaikan Kelas Massal" (hanya jika tahun berikutnya tersedia)
  → Modal Step 1: Tabel siswa + checkbox (semua centang default); counter "X siswa dipilih"
  → Modal Step 2: Pilih kelas tujuan (dropdown kelas tahun pelajaran berikutnya)
  → Modal Step 3: Summary "Memindahkan X siswa dari [Kelas Asal] ke [Kelas Tujuan] tahun [TP]"
    → Warning merah: "Aksi ini tidak dapat dibatalkan"
    → Tombol "Konfirmasi Kenaikan Kelas"
  → Batch UPDATE enrollments (lama → 'promoted') + batch INSERT enrollments (baru)
  → Redirect ke halaman kelas tujuan; toast success
```

---

## 8. Infrastructure & Deployment

### 8.1 Environment Setup

```bash
# .env (server-only)
DATABASE_URL="postgresql://user:pass@neon-host/edara-prod?sslmode=require"
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# .env.local (dapat diekspos ke client)
VITE_CLERK_PUBLISHABLE_KEY="pk_live_..."
VITE_APP_URL="https://app.edara.id"
```

**Neon Database Setup:**

- Main branch: production
- Dev branch: per-developer menggunakan Neon branching
- Connection pooling via Neon built-in PgBouncer (direkomendasikan untuk serverless)

```typescript
// server/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**pg-boss Configuration (Colocated — Keputusan C3):**

```typescript
// server/jobs/index.ts — diimport di server entry point
import PgBoss from "pg-boss";

export const pgBoss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  schema: "pgboss",
});

export async function startJobWorkers() {
  await pgBoss.start();
  pgBoss.work(
    "bulk-import-teachers",
    { teamSize: 2 },
    processBulkImportTeachers,
  );
  pgBoss.work(
    "bulk-import-students",
    { teamSize: 2 },
    processBulkImportStudents,
  );
  pgBoss.work("generate-bills", generateBillsForYear);
  pgBoss.work("generate-excel-report", generateExcelReport);
  pgBoss.work("generate-pdf-report", generatePdfReport);
}
// Dipanggil bersama dengan server start — bukan container terpisah
```

### 8.2 Deployment Pipeline

**Development Workflow:**

```bash
pnpm install
pnpm db:push          # Push schema ke Neon dev branch
pnpm dev              # TanStack Start dev server dengan HMR
```

**Build Process:**

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # ESLint
pnpm test             # Vitest (unit + integration)
pnpm build            # Vite production build → dist/
```

**CI/CD (GitHub Actions):**

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm db:migrate
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

**Database Migrations:**

```bash
pnpm drizzle-kit generate   # Generate migration dari perubahan schema
pnpm drizzle-kit migrate    # Apply migration ke database
pnpm drizzle-kit push       # Push schema langsung ke dev (tanpa migration file)
```

### 8.3 Testing Strategy

**Unit Tests (Vitest):**

- Zod schema validation logic
- Business logic utilities (calculateDiscount, formatRupiah, getMonthsInYear, billingMonthFromDate)
- oRPC procedures dengan mocked Drizzle client

**Integration Tests (Vitest + Neon test branch):**

- Full oRPC procedure flows terhadap database real
- Akurasi komputasi pembayaran (status paid/partial/unpaid)
- Logika enrollment promotion
- Aktivasi tahun pelajaran dan unique constraint enforcement

**E2E Tests (Playwright — Phase 2):**

- Login dan unit selection flow
- Critical payment recording flow
- Bulk import flow

**Test File Conventions:**

```
src/lib/utils.test.ts
src/lib/formatters.test.ts
src/server/routers/spp.test.ts
src/features/spp/__tests__/
```

---

## Appendix A — Naming Conventions

| Konteks              | Convention           | Contoh                                    |
| -------------------- | -------------------- | ----------------------------------------- |
| Files / directories  | `kebab-case`         | `student-form-drawer.tsx`                 |
| React components     | `PascalCase`         | `StudentFormDrawer`                       |
| Functions / hooks    | `camelCase`          | `useStudentData`, `formatRupiah`          |
| Constants            | `UPPER_SNAKE_CASE`   | `ENROLLMENT_STATUS_LABELS`                |
| DB tables            | `snake_case`         | `payment_transactions`                    |
| DB columns           | `snake_case`         | `academic_year_id`                        |
| oRPC procedures      | `camelCase`          | `recordPayment`, `importPreview`          |
| Zod schemas          | `camelCase + Schema` | `teacherCreateSchema`                     |
| Env variables        | `UPPER_SNAKE_CASE`   | `DATABASE_URL`                            |
| Activity log actions | `entity.verb`        | `student.created`, `spp.payment.recorded` |

---

## Appendix B — Key Business Rules

1. **Academic Year Singleton:** Hanya satu `is_active = true` per unit dalam satu waktu. Diterapkan oleh partial unique index di DB.
2. **Discount Lock:** `discount_schemes.is_locked = true` setelah tahun pelajaran diaktifkan. API menolak UPDATE/DELETE pada skema yang terkunci. Super Admin dapat override dengan alasan wajib yang tercatat di audit log.
3. **Append-Only Payments:** `payment_transactions` tidak memiliki UPDATE/DELETE di tingkat aplikasi. Semua koreksi via reversal records.
4. **Student NISN Uniqueness:** Unik per school (bukan global). NISN yang sama di dua sekolah berbeda diperbolehkan.
5. **Enrollment Uniqueness:** Satu enrollment per (student, academic_year). Diterapkan oleh unique index. Pindah kelas dalam satu tahun → update `class_id` pada enrollment existing.
6. **Payment Status Computation:** Status (`paid/partial/unpaid`) tidak pernah disimpan. Selalu dihitung dari `SUM(payment_transactions.amount)` vs `payment_bills.net_amount`.
7. **Overpayment Handling:** Kelebihan bayar dicatat sebagai transaksi terpisah dengan `transaction_type = 'overpayment'`. Tidak otomatis mengurangi tagihan berikutnya.
8. **Billing Cancellation:** Bill yang belum memiliki payment_transactions boleh di-cancel (`status = 'cancelled'`). Bill dengan transaksi tidak bisa di-cancel — koreksi via reversal transaksi.
9. **Activity Log:** Semua CREATE/UPDATE/DELETE pada `students`, `teachers`, `enrollments`, `payment_transactions`, `cashflow_transactions` menghasilkan entry `activity_logs` yang sesuai. Diterapkan via `withActivityLog` middleware.
10. **Multi-unit Access:** `admin_tu` dan `bendahara` dapat ditetapkan ke beberapa unit. Setiap request harus membawa konteks `unitId` eksplisit yang divalidasi terhadap tabel assignments.
11. **Soft Delete Teachers:** Guru di-soft-delete (`is_active = false`). Siswa tidak pernah dihapus — hanya status enrollment yang berubah.
12. **Cashflow Auto-Link:** Pembayaran SPP yang berhasil dicatat otomatis membuat record di `cashflow_transactions` dengan `spp_payment_id` ter-link. Record cashflow yang ter-link tidak dapat diedit atau dihapus dari modul cashflow.
13. **Event Status:** Kegiatan lampau dengan status "Berlangsung" tidak di-auto-update oleh sistem. Admin harus manual update ke "Selesai" untuk menjaga integritas audit trail.

---

## Appendix C — Resolved Critical Considerations

Bagian ini mendokumentasikan keputusan eksplisit untuk 9 open questions yang diidentifikasi sebelum pengembangan.

**C1 — Siapa yang menulis ke `activity_log`?**

KEPUTUSAN: `withActivityLog` middleware yang terpusat di `server/middleware/activity-log.ts`. Middleware ini dibungkuskan ke setiap `.mutation()` call yang relevan via deklarasi eksplisit per procedure. Developer tidak perlu memanggil `logActivity()` secara manual. Setiap procedure yang ingin dicatat mendeklarasikan `config` berupa `{ action, entityType, getEntityId, buildDescription }`. Procedure yang tidak memerlukan log dapat unskip — tidak perlu opt-out flag karena middleware harus didaftarkan secara eksplisit.

**C2 — Notifikasi WhatsApp?**

KEPUTUSAN: Di luar scope Phase 1. Fitur ini tidak ada dalam feature list yang disetujui. Tidak ada implementasi, tidak ada tabel, tidak ada job untuk WhatsApp di Phase 1. Dapat ditambahkan di Phase 2 sebagai modul terpisah dengan template yang disimpan di database.

**C3 — Bagaimana pg-boss dijalankan di production?**

KEPUTUSAN: Single container, shared process untuk MVP. Worker pg-boss di-start bersamaan dengan TanStack Start server di `server/jobs/index.ts` yang diimport oleh server entry point. Tidak ada container atau process terpisah. Jika volume job meningkat signifikan, pindah ke dedicated worker container di Phase 2.

**C4 — Apakah `billing` bisa dihapus jika salah generate?**

KEPUTUSAN: Soft-cancel via kolom `status`. `payment_bills` memiliki kolom `status: 'active' | 'cancelled'`. Bill yang belum ada `payment_transactions`-nya boleh di-cancel (set `status = 'cancelled'`). Bill dengan transaksi tidak bisa di-cancel — koreksi melalui reversal di level transaksi. Ini mempertahankan spirit append-only sambil memberi fleksibilitas operasional.

**C5 — Format penyimpanan periode tagihan?**

KEPUTUSAN: `VARCHAR(7)` dengan format `"YYYY-MM"` (contoh: `"2024-08"`). String comparison lexicographically correct untuk urutan kronologis. Label UI diformat dari string ini menggunakan `formatBillingMonth("2024-08") → "Agustus 2024"`. Konsisten dengan schema yang sudah menggunakan pola ini.

**C6 — Apakah satu siswa bisa punya dua enrollment aktif di tahun yang sama?**

KEPUTUSAN: Tidak. Unique constraint `(student_id, academic_year_id)` pada tabel `enrollments`. Pindah kelas dalam satu tahun ditangani dengan UPDATE `class_id` pada enrollment existing (bukan INSERT baru), dengan history dicatat di `enrollment_status_history` dengan metadata `{ fromClassId, toClassId, reason }`.

**C7 — Clerk `publicMetadata` diperbarui di mana?**

KEPUTUSAN: Server-side via Clerk Management API, dipanggil dari oRPC procedure `users.updateRole`. Tidak ada manual dashboard Clerk. Saat Super Admin mengubah role/unit user, aplikasi langsung memanggil `clerkClient.users.updateUserMetadata()`. Perubahan berlaku pada token refresh berikutnya (~15 menit) atau saat user logout-login.

**C8 — Berapa lama log aktivitas disimpan?**

KEPUTUSAN: Tidak ada auto-deletion untuk Phase 1. `activity_logs` disimpan selamanya. Index pada `(unit_id)` dan `(created_at)` memastikan query tetap performan. Review dan implementasi retention policy (misalnya: hapus log >2 tahun) saat row count melebihi 1 juta.

**C9 — Sesi berakhir?**

KEPUTUSAN: Sesi berakhir setelah 8 jam tidak aktif. Modal "Sesi Anda telah berakhir" saat user kembali aktif; email di-pre-fill di form login. Ditangani oleh Clerk session management bawaan.

---

## Appendix D — Architectural Decision Records

### ADR-01: Vite SPA untuk Phase 1 (bukan SSR penuh)

**Status:** Accepted

**Konteks:** TanStack Start mendukung SSR penuh, tetapi Phase 1 tidak memiliki infrastruktur backend real yang perlu dirender di server. Semua data di-fetch client-side via oRPC.

**Keputusan:** Gunakan Vite SPA mode untuk Phase 1. TanStack Start tetap di dependency untuk upgrade SSR di Phase 2 tanpa perubahan routing.

**Konsekuensi:** SEO tidak optimal (tidak kritis untuk aplikasi admin internal). Deployment lebih sederhana — output berupa static files + Node.js server untuk API. Cold start lebih cepat.

---

### ADR-02: Shared Schema Multi-Tenancy (bukan per-database atau per-schema)

**Status:** Accepted

**Konteks:** Tiga opsi dipertimbangkan: (1) Shared database + shared schema dengan `school_id`, (2) Database terpisah per tenant, (3) Schema PostgreSQL terpisah per tenant.

**Keputusan:** Opsi 1 — Shared schema dengan `school_id` di setiap tabel + PostgreSQL RLS.

**Rationale:** Standar industri (Salesforce, Shopify). Maintenance lebih mudah — satu database untuk satu update fitur. Performa dijamin dengan indexing pada `(school_id, unit_id)`. Database terpisah hanya diperlukan jika ada regulasi kerahasiaan tingkat tinggi dari tenant — belum ada requirement tersebut untuk Phase 1.

**Konsekuensi:** RLS policies wajib di-test secara ketat. RLS session variables harus di-set sebelum setiap query via Drizzle middleware.

---

### ADR-03: Computed Payment Status (tidak disimpan)

**Status:** Accepted

**Konteks:** Status pembayaran SPP (paid/partial/unpaid) dapat disimpan sebagai kolom atau dihitung dari transaksi.

**Keputusan:** Selalu dihitung dari `SUM(payment_transactions)` via SQL aggregation. Tidak ada kolom `status` pada `payment_bills` untuk payment status.

**Rationale:** Eliminasi risiko inkonsistensi antara status yang disimpan dan transaksi aktual. Reversal dan overpayment ditangani secara otomatis tanpa perlu update status. Trade-off: query sedikit lebih berat, dikompensasi dengan index pada `(bill_id)` di `payment_transactions`.

---

### ADR-04: Centralized Activity Log via Middleware

**Status:** Accepted

**Konteks:** Logging bisa dilakukan per-prosedur (manual) atau via middleware terpusat (otomatis).

**Keputusan:** Middleware terpusat `withActivityLog` yang harus didaftarkan secara eksplisit per procedure yang perlu dicatat.

**Rationale:** Mencegah log terlewat karena developer lupa. Konsistensi format log di seluruh aplikasi. Eksplisit (harus didaftarkan) lebih aman daripada implicit (semua mutation dicatat otomatis, termasuk yang tidak perlu).

---

### ADR-05: pg-boss Colocated dengan Server Process

**Status:** Accepted untuk Phase 1

**Konteks:** pg-boss worker bisa berjalan di container terpisah (proper) atau dalam proses yang sama dengan server web.

**Keputusan:** Colocated dalam satu proses untuk Phase 1.

**Rationale:** Mengurangi kompleksitas deployment. Untuk volume job yang diperkirakan (bulk import, report generation untuk sekolah kecil-menengah), satu proses cukup. Jika terjadi bottleneck, ekstraksi ke dedicated worker container adalah perubahan infrastruktur yang tidak memengaruhi kode bisnis.

**Konsekuensi:** Satu proses crash memengaruhi server web DAN job processing. Acceptable risk untuk MVP. Review jika ada SLA yang ketat di Phase 2.

## ADR-06: `teachers.mataPelajaran` sebagai JSON Array Column (bukan Junction Table)
**Status:** Accepted
**Konteks:** ERD di `Edara_Database_Strategy.md` (dokumen perencanaan awal) menyarankan junction table `teaching_assignments` + `subjects`. Tech Spec v2.0.0 mengambil keputusan berbeda: kolom `mataPelajaran text` pada tabel `teachers`.
**Keputusan:** Simpan mata pelajaran guru sebagai JSON array di `teachers.mataPelajaran` untuk Phase 1. Contoh: `["Matematika", "IPA", "IPS"]`. Junction table di-defer.
**Rationale:** Tidak ada user story Phase 1 yang membutuhkan relasi teaching assignment ke kelas tertentu. Kebutuhan aktual hanya dua: filter guru per mata pelajaran (ditangani dengan JSON containment operator PostgreSQL) dan tampilan di profil guru. Junction table membutuhkan tabel `subjects` dengan CRUD tersendiri dan relasi ke `classes` per academic year — over-engineering untuk kebutuhan ini.
**Konsekuensi:** Jika Phase 2 membutuhkan jadwal pelajaran atau assignment guru ke kelas, migrasi dari JSON array ke relational table adalah pekerjaan yang terdefinisi dan tidak memblokir Phase 1.

---

## ADR-07: Financial Precision with decimal.js

**Date:** 2024-04-05  
**Status:** Accepted

### Context

JavaScript's native `Number` type follows the IEEE 754 floating-point standard, which is inherently inaccurate for base-10 decimal calculations (e.g., `0.1 + 0.2` results in `0.30000000000000004`). In a school administration system where every cent must be accounted for (SPP, Cashflow, Reports), floating-point errors are unacceptable and can lead to financial discrepancies.

### Decision

All financial computations within the Service Layer and throughout the application **MUST** use the `decimal.js` library. The use of native JavaScript primitives (`Number`, `parseFloat`, `parseInt`) for monetary values is strictly prohibited.

**Implementation Rules:**

1. **Database Storage:** Use the `numeric(...)` type in PostgreSQL for all monetary columns.
2. **Runtime Type:** Financial values should be treated as `string` when fetched via Drizzle or passed through oRPC to prevent accidental conversion to native floats.
3. **Calculation:** Use `new Decimal(value)` for initialization. Use `.plus()`, `.minus()`, `.times()`, and `.dividedBy()` for all arithmetic.
4. **Formatting:** Use `.toFixed()` or `Decimal`'s rounding methods before passing the final value to `Intl.NumberFormat` for UI display.
5. **Validation:** Use Zod's `.string().regex()` or a custom `Decimal` validator in the Schema layer.

### Consequences

- **Auditability:** Financial reports will be mathematically sound and match database records exactly.
- **Developer Discipline:** Requires explicit conversion using `new Decimal()`, reducing the chance of accidental "silent" errors.
- **Interoperability:** Strings are safe for JSON transport across oRPC without precision loss.

---

_Dokumen ini adalah input utama untuk sistem perencanaan AI dan code generation EDARA. Seluruh keputusan arsitektur di dalamnya bersifat final untuk Phase 1 development._
