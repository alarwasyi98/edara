# Product Requirements Document — EDARA

> Canonical product specification. Extracted from `src/docs/technical-specification.md` and `src/docs/features-stories.md`.
> Auth references updated from Clerk to Better Auth per migration decision (C7).

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

| Keputusan | Pilihan | Rationale |
|-----------|---------|-----------|
| Full-stack Framework | TanStack Start | Type-safe, file-based routing, Vite-native; SSR diaktifkan di Phase 2 |
| Render Mode Phase 1 | Vite SPA | Tidak ada infrastruktur backend real yang perlu di-SSR; simplifikasi deployment |
| API Layer | oRPC | End-to-end TypeScript type safety, zero schema drift, integrasi native dengan TanStack Query |
| Auth Provider | Better Auth | Self-hosted identity/session management; EDARA handles tenancy/RBAC via `user_school_assignments` |
| Database | PostgreSQL (Neon Serverless) | Serverless scaling, branching untuk dev/staging, mendukung RLS policies |
| ORM | Drizzle | Type-safe schema-first, zero-overhead query builder, native Neon support |
| Background Jobs | pg-boss | PostgreSQL-native job queue — tidak perlu Redis, memanfaatkan Neon instance yang ada |
| State Management | Zustand + TanStack Query | TanStack Query untuk server state; Zustand untuk UI state ephemeral |
| Styling | Tailwind CSS v4 + shadcn/ui | Design token system, headless components, kustomisasi penuh via CSS variables |
| Form Management | React Hook Form + Zod | Schema-driven validation, performant, shared schemas antara client dan server |

---

## 2. System Architecture

### 2.1 Architecture Overview

EDARA menggunakan TanStack Start sebagai unified full-stack framework. oRPC router menangani HTTP API calls yang dikonsumsi via TanStack Query.

**Key Architectural Patterns:**

- **Multi-Tenancy via Shared Schema:** Setiap tabel database membawa `school_id` (tenant) dan opsional `unit_id` (sub-tenant). PostgreSQL RLS policies menerapkan isolasi di lapisan database. Better Auth session token menyediakan userId; Drizzle middleware resolves assignment dan menetapkan variabel sesi Postgres `app.current_school` sebelum setiap query.
- **Computed State over Stored Status:** Status pembayaran SPP (paid/partial/unpaid) tidak pernah disimpan — diturunkan via SQL aggregation dari `payment_transactions` pada waktu query.
- **Append-Only Financial Records:** `payment_transactions` tidak memiliki kolom `updated_at` dan tidak ada izin UPDATE/DELETE. Koreksi menggunakan reversal transactions.
- **Centralized Activity Log via Middleware:** Setiap oRPC `.mutation()` dibungkus oleh `withActivityLog` middleware. Developer tidak perlu memanggil log secara manual.
- **pg-boss Colocation:** Worker pg-boss berjalan dalam proses yang sama dengan server (Phase 1).

### 2.2 Data Flow

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
  ├── Better Auth middleware: validate session, extract userId
  ├── Assignment resolution: resolve schoolId, unitId, role from user_school_assignments
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
  ▼
TanStack Query cache invalidation → UI auto-updates
```

### 2.3 Technology Stack

#### Frontend

| Teknologi | Versi | Tujuan |
|-----------|-------|--------|
| React | ^19.x | UI framework |
| TanStack Start | latest | Full-stack framework (SPA Phase 1, SSR Phase 2) |
| TanStack Router | ^1.x | File-based routing, type-safe |
| TanStack Query | ^5.x | Server state, caching, mutations |
| Zustand | ^5.x | UI state (active unit, sidebar, theme) |
| Tailwind CSS | ^4.x | Utility-first CSS, design tokens |
| shadcn/ui (Radix UI) | latest | Headless accessible components |
| React Hook Form | ^7.x | Form state management |
| Zod | ^4.x | Schema validation (shared dengan server) |
| Recharts | ^2.x | Charts — cashflow, SPP trends |
| react-big-calendar | latest | Calendar view untuk events |
| Lucide React | ^0.5x | Icon library |
| Sonner | latest | Toast notifications |

#### Backend

| Teknologi | Versi | Tujuan |
|-----------|-------|--------|
| TanStack Start (server) | latest | Node.js server, API handler |
| oRPC | latest | Type-safe RPC layer |
| Better Auth | latest | Identity & session management |
| Drizzle ORM | latest | Type-safe SQL query builder |
| pg-boss | latest | PostgreSQL-native job queue (colocated) |
| ExcelJS | latest | Excel file generation (exports) |
| SheetJS (xlsx) | latest | Excel file parsing (imports) |
| pdf-lib | latest | PDF generation (reports) |

#### Infrastructure

| Teknologi | Tujuan |
|-----------|--------|
| Neon (serverless PostgreSQL) | Primary database + pg-boss queue |
| Better Auth | Identity provider, session management |
| Vercel / Netlify | Deployment platform |
| pnpm | Package manager |
| Vitest | Unit & integration testing |

---

## 3. Feature Specifications

### 3.1 Multi-Tenant & Organizational Structure (MT-01–05)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| MT-01 | Admin Yayasan mendaftarkan yayasan dengan nama, logo, alamat, nomor legalitas | Foundation dibuat dengan semua field terpersistens; logo disimpan sebagai URL; redirect ke halaman pembuatan unit |
| MT-02 | Admin Yayasan membuat unit pendidikan di bawah yayasan | Unit dibuat dengan jenjang, NPSN, alamat, kontak; unit terisolasi dari unit lain |
| MT-03 | Admin Yayasan melihat metrik agregat lintas semua unit | Dashboard menampilkan jumlah siswa, guru, pemasukan SPP bulanan di semua unit |
| MT-04 | Pengguna scoped-unit hanya mengakses data unit yang ditetapkan | Query tanpa konteks unit yang valid mengembalikan 403; RLS policy menerapkan ini di level DB |
| MT-05 | Super Admin dapat beralih konteks unit aktif | Unit switcher di header; beralih konteks me-reset data dashboard aktif |

**UI Components:**
- Unit Grid: 3 kolom (desktop), 2 (tablet), 1 (mobile). Kartu: avatar/logo, nama, badge jenjang, NPSN, siswa aktif, status badge
- Unit Switcher (Topbar): Nama unit aktif + chevron-down → dropdown list. Mobile: bottom sheet
- Add/Edit Unit (Side Drawer 480px): Section Identitas + Section Lokasi & Kontak. Footer sticky: Batal + Simpan

**Technical:** `resolveTenantContext(userId)` resolves assignments from `user_school_assignments`. `TenantStore` (Zustand) holds `activeSchoolId`, `activeUnitId`, `availableUnits`.

### 3.2 Authentication & RBAC (AUTH-01–05)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| AUTH-01 | User login dengan email dan password | Better Auth menangani auth; session token diterbitkan |
| AUTH-02 | User multi-unit melihat unit selector setelah login | Jika user memiliki >1 assignment unit, halaman pemilih unit muncul sebelum redirect ke dashboard |
| AUTH-03 | Super Admin membuat dan mengelola akun user | Pembuatan user via Better Auth Admin API; assignment role dan unit disimpan di `user_school_assignments` |
| AUTH-04 | Halaman unauthorized menampilkan pesan informatif | Route guards memeriksa role; render `<UnauthorizedState>` — sidebar tetap terlihat |
| AUTH-05 | Admin menetapkan role dan unit ke user | Assignment update `user_school_assignments`; perubahan efektif pada session refresh berikutnya |

**RBAC Matrix:**

| Role | Scope | Siswa | Guru | Kelas | SPP | Cashflow | Users | Settings |
|------|-------|-------|------|-------|-----|----------|-------|----------|
| `super_admin` | Yayasan | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD |
| `kepala_sekolah` | Unit | Read | Read | Read | Read | Read | — | Read |
| `admin_tu` | Unit(s) | CRUD | CRUD | CRUD | Read | — | — | Limited |
| `bendahara` | Unit(s) | Read | Read | Read | CRUD | CRUD | — | — |

**UI Components:**
- Login Page (Desktop): Split layout — kiri 40% branding, kanan 60% form
- Login Page (Mobile): Form full-screen, logo kecil di tengah atas
- Error State: Banner merah, animasi shake 300ms. 5 kali gagal: disable + countdown
- Unauthorized Page: Dashboard shell utuh; ilustrasi kunci + penjelasan role

### 3.3 Academic Year Management (AY-01–04)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| AY-01 | Admin membuat tahun pelajaran dengan nama, tanggal mulai/selesai | Tersimpan ke `academic_years`; dapat langsung diaktifkan |
| AY-02 | Hanya satu tahun pelajaran aktif per unit dalam satu waktu | DB constraint: partial unique index pada `(unit_id, is_active) WHERE is_active = true` |
| AY-03 | Mengaktifkan tahun baru otomatis menonaktifkan tahun aktif saat ini | DB transaction: UPDATE previous → is_active=false, UPDATE new → is_active=true |
| AY-04 | Semua kelas, enrollments, tagihan terikat ke tahun pelajaran | Semua tabel terkait memiliki FK `academic_year_id` yang tidak nullable |

**UI Components:**
- Timeline Vertikal: Item terbaru di atas; item aktif: border kiri tebal Forest + label "Aktif Saat Ini"
- Form Tambah (Modal): Nama*, date picker mulai/selesai, validasi overlap
- Aktivasi Flow: Confirmation dialog eksplisit; post-aktivasi: toast + CTA "Atur Kelas Sekarang →"

### 3.4 Analytics Dashboard (DASH-01–05)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| DASH-01 | Semua role melihat satu dashboard yang sama | Tidak ada conditional rendering per role di level konten |
| DASH-02 | StatCards menampilkan jumlah real-time | Data via oRPC dashboard procedures + TanStack Query |
| DASH-03 | Chart cashflow menampilkan tren 6 bulan | Recharts BarChart grouped (Forest = pemasukan, Amber = pengeluaran) |
| DASH-04 | Daftar kegiatan mendatang (3–5 event terdekat) | Filter `start_date >= NOW()` ordered ASC, limit 5 |
| DASH-05 | Activity log menampilkan aksi sistem terbaru | Feed dari `activity_logs` ordered DESC, limit 10 per halaman |

**Layout Desktop (3 baris):**
1. Summary Cards (3): Total Siswa Aktif, Total Guru Aktif, Pemasukan SPP Bulan Ini (with delta)
2. Chart & Kegiatan: Kiri 60% chart tren arus kas, Kanan 40% kegiatan mendatang
3. Log Aktivitas: Feed kronologis 10 entri, grouped per hari

### 3.5 Teacher Management (TCH-01–05)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| TCH-01 | Admin menambah guru dengan data identitas dan kepegawaian lengkap | Semua field wajib divalidasi server-side; foto sebagai URL |
| TCH-02 | Daftar guru mendukung pencarian dan filter | Full-text search via `ilike`; filter faceted sebagai WHERE clause |
| TCH-03 | Admin soft-delete (nonaktifkan) guru | `is_active = false`; data tetap di DB; toggle filter visibilitas |
| TCH-04 | Bulk import dari Excel dengan preview, highlight error, partial import | SheetJS parse; server validasi per baris; baris valid diimport dalam transaction |
| TCH-05 | Ekspor mengikuti filter aktif | Server menerapkan kondisi filter yang sama ke query ekspor |

**UI Components:**
- Page Header: Judul + badge counter; tombol "+ Tambah Guru", "Import", "Ekspor"
- Filter Bar: Dropdown Status Kepegawaian, Mata Pelajaran (multi-select), toggle "Tampilkan Nonaktif"
- Table: Avatar, Nama, NIK, Status Kepegawaian (badge), Mata Pelajaran, Tanggal Bergabung, Status, Aksi
- Add/Edit Side Drawer (520px): Section Identitas + Section Kepegawaian + upload foto
- Bulk Import (4 Steps): Unduh Template → Upload File → Preview & Validasi → Konfirmasi Import

### 3.6 Class Management (CLS-01–03)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| CLS-01 | Admin membuat kelas terikat tahun pelajaran | Record `classes` memiliki `academic_year_id` tidak nullable |
| CLS-02 | Daftar kelas menampilkan progress bar kapasitas | Jumlah enrollment aktif vs field `capacity` |
| CLS-03 | Kenaikan kelas massal via 3-step modal | DB transaction: batch UPDATE enrollments (lama → 'promoted') + batch INSERT enrollments (baru) |

**UI Components:**
- Class Grid (per tingkat): Subheader per tingkat, kartu dengan progress bar kapasitas
- Kenaikan Kelas Massal (3-Step Modal): Konfirmasi siswa → Pilih kelas tujuan → Ringkasan & eksekusi

### 3.7 Student Management (STU-01–06)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| STU-01 | Admin mendaftarkan siswa baru dengan data identitas lengkap | Record `students` + `enrollments` dibuat dalam satu transaction |
| STU-02 | Daftar siswa mendukung pencarian, filter, dan paginasi server-side | oRPC procedure dengan Zod-validated query params |
| STU-03 | Detail siswa menampilkan profil, riwayat enrollment, dan riwayat pembayaran | Tab-based detail page |
| STU-04 | Admin mengubah status siswa (mutasi, kelulusan, dropout) | Status change menulis ke `enrollment_status_history` dengan metadata |
| STU-05 | Bulk import siswa dari Excel dengan deteksi duplikat NISN | NISN unique per school; duplikat ditandai di preview |
| STU-06 | Siswa tidak pernah dihapus permanen | Soft lifecycle — status terminal, data tetap di DB |

**UI Components:**
- Registration Drawer: Form identitas + auto-enroll ke tahun/kelas aktif
- Detail Page: Tabs (Profil, Enrollment, Pembayaran)
- Status Transition: Dialog per tipe (Transfer, Graduate, Dropout) dengan metadata fields

### 3.8 SPP Payment System (SPP-01–10)

**Three sub-systems:**

#### 3.8.1 Configuration (SPP-01–03)
- Payment categories (Bulanan, Tahunan, Insidental)
- Class payment rates matrix (rate per category per class)
- Discount schemes per student per category (auto-lock `is_locked` mid-year)

#### 3.8.2 Payment Recording (SPP-04–07)
- 4-step recording flow: Pilih siswa → Pilih tagihan → Input nominal → Konfirmasi
- Overpayment handling: auto-create second transaction
- Reversal flow: new `reversal` type transaction linked via `reversedById`
- Auto-link to cashflow: INSERT `cashflow_transactions` in same transaction block

#### 3.8.3 Monitoring (SPP-08–10)
- Payment matrix UI: grid siswa × bulan, status computed via SQL aggregation
- Arrears table: outstanding balances per student
- Bill auto-generation: pg-boss job creates `payment_bills` periodically

### 3.9 Cashflow Management (CF-01–04)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| CF-01 | Bendahara mencatat pemasukan/pengeluaran manual | Form modal dengan toggle income/expense |
| CF-02 | Dashboard cashflow menampilkan 3 summary cards | Total Pemasukan, Total Pengeluaran, Saldo Bersih |
| CF-03 | Chart tren arus kas 6 bulan | Recharts grouped bar chart |
| CF-04 | Entri auto-linked dari SPP tidak dapat diedit/dihapus | Dropdown aksi menyembunyikan edit/hapus jika `sppPaymentId` exists |

**UI Components:**
- 3 Summary Cards: Pemasukan (hijau), Pengeluaran (merah), Saldo (biru/abu)
- Filter Bar: Rentang tanggal, kategori, tipe (income/expense)
- Transaction Table: Tanggal, Kategori, Deskripsi, Nominal, Tipe, Aksi
- Add Modal: Toggle income/expense, kategori dropdown, nominal, deskripsi, tanggal

### 3.10 Events & Calendar (EVT-01–04)

**User Stories:**

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| EVT-01 | Admin membuat kegiatan sekolah dengan kategori dan rentang tanggal | Record `school_events` tersimpan |
| EVT-02 | Daftar kegiatan mendukung dua tampilan: tabel dan kalender | Tab switcher: DataTable vs Calendar view |
| EVT-03 | Kalender menampilkan chip berwarna per kategori | Chip warna sesuai `eventCategoryEnum` |
| EVT-04 | Detail kegiatan dapat dilihat dan diedit via side drawer | Side drawer 480px dengan form edit |

**UI Components:**
- 4 Summary Cards: Total Kegiatan, Mendatang, Berlangsung, Selesai
- DataTable Tab: Sortable table with filters
- Calendar Tab: Monthly view with colored chips per category
- Side Drawer: Detail view + edit form

---

## 4. Data Architecture

### 4.1 Database Schema (18 Tables)

All tables defined in Drizzle ORM. Complete schema definitions in `src/server/db/schema/`.

| Domain | Table | Key Columns | Notes |
|--------|-------|-------------|-------|
| Core | `schools` | id, name, logo_url, address, legal_number | Root tenant |
| Core | `school_units` | id, school_id, name, level, npsn | Sub-tenant |
| Academic | `academic_years` | id, unit_id, name, start_date, end_date, is_active | Partial unique index on (unit_id) WHERE is_active |
| Personnel | `teachers` | id, unit_id, school_id, name, nik, mata_pelajaran (JSON) | ADR-06: JSON array for subjects |
| Students | `students` | id, unit_id, school_id, name, nisn | NISN unique per school |
| Classes | `classes` | id, unit_id, academic_year_id, name, grade, capacity | Bound to academic year |
| Enrollments | `enrollments` | id, student_id, class_id, academic_year_id, status | Status enum: active/graduated/transferred/dropped_out/promoted |
| Enrollments | `enrollment_status_history` | id, enrollment_id, old_status, new_status, changed_by, metadata | Audit trail for status transitions |
| SPP | `payment_categories` | id, unit_id, name, type | Bulanan/Tahunan/Insidental |
| SPP | `class_payment_rates` | id, class_id, category_id, amount | Rate per class per category |
| SPP | `discount_schemes` | id, student_id, category_id, amount, is_locked | Auto-lock mid-year |
| SPP | `payment_bills` | id, student_id, category_id, billing_month, net_amount | CHECK constraint on billing_month format |
| SPP | `payment_transactions` | id, bill_id, amount, type, recorded_by, reversed_by_id | **Append-only** — no updated_at, no UPDATE/DELETE |
| Cashflow | `cashflow_categories` | id, unit_id, name, type | Income/Expense |
| Cashflow | `cashflow_transactions` | id, unit_id, category_id, amount, type, spp_payment_id | Optional FK to payment_transactions |
| Events | `school_events` | id, unit_id, name, category, status, start_date, end_date | Category enum + Status enum |
| Users | `user_school_assignments` | id, user_id, school_id, unit_id, role | Links Better Auth user to tenant/role |
| Logs | `activity_logs` | id, school_id, actor_id, action, entity_type, entity_id, metadata | Centralized audit trail |

**Better Auth Tables** (managed by Better Auth):
- `user` — Identity (email, name, image, emailVerified)
- `session` — Active sessions (token, expiresAt, userId)
- `account` — OAuth providers (providerId, accountId, userId)
- `verification` — Email/phone verification tokens

### 4.2 RLS Policies

```sql
-- Tenant isolation
CREATE POLICY tenant_isolation ON [table]
  USING (school_id = current_setting('app.current_school')::uuid);

-- Unit isolation (for unit-scoped tables)
CREATE POLICY unit_isolation ON [table]
  USING (unit_id = current_setting('app.current_unit')::uuid);
```

### 4.3 Index Strategy

- Composite indexes on `(school_id, unit_id)` for all tenant-scoped tables
- Partial unique index on `academic_years (unit_id) WHERE is_active = TRUE`
- Unique index on `students (school_id, nisn)` for NISN deduplication
- Index on `payment_transactions (bill_id)` for aggregation queries

---

## 5. API Specifications

### 5.1 oRPC Router Structure

```typescript
const appRouter = router({
  tenant: tenantRouter,       // schools, units
  auth: authRouter,           // Better Auth handlers
  users: usersRouter,         // assignments, roles
  academicYears: academicYearsRouter,
  dashboard: dashboardRouter,
  teachers: teachersRouter,
  classes: classesRouter,
  students: studentsRouter,
  spp: sppRouter,             // config, payments, monitoring
  cashflow: cashflowRouter,
  events: eventsRouter,
  reports: reportsRouter,
  activityLogs: activityLogsRouter,
});
```

### 5.2 Middleware Stack

```
Request
  → BetterAuth (session verification)
    → requireUnitContext (resolve school_id + unit_id)
      → requireRole(['admin_tu', 'bendahara', ...])
        → withActivityLog({ action, entity, getEntityId })
          → Procedure Handler
            → Response
```

### 5.3 Key Procedures

**Teachers Router:**
- `list`: Paginated with filters (status, subject, search)
- `create` / `update`: Zod-validated, with activity log
- `deactivate`: Soft-delete (`is_active = false`)
- `importExecute`: Queue pg-boss job for bulk import

**SPP Router:**
- `recordPayment`: Append-only transaction with overpayment handling + cashflow auto-link
- `reversePayment`: New reversal transaction linked via `reversedById`
- `getPaymentMatrix`: Server-computed status grid (SQL aggregation)
- `getArrears`: Outstanding balances per student

### 5.4 Response Standards

- **Validation:** Zod schemas on all inputs
- **Error codes:** `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`
- **Pagination:** `{ data: T[], total: number, page: number, pageSize: number }`

---

## 6. Security & Privacy

### 6.1 Auth Session Flow

1. User submits credentials → Better Auth validates → session created
2. Client receives session token via cookie
3. oRPC requests include session cookie automatically
4. Server middleware validates session via Better Auth
5. Assignment resolution: query `user_school_assignments` for schoolId, unitId, role
6. RLS context set: `set_config('app.current_school', schoolId)`

### 6.2 Data Security

- **Encryption:** Neon provides encryption at rest and in transit
- **Financial immutability:** `REVOKE UPDATE, DELETE ON payment_transactions FROM app_user`
- **PII handling:** Student/teacher personal data scoped to tenant via RLS

### 6.3 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | RLS + RBAC middleware + role checks |
| A02 Cryptographic Failures | Neon TLS, Better Auth password hashing |
| A03 Injection | Drizzle parameterized queries, Zod validation |
| A07 Auth Failures | Better Auth managed auth with session management |

### 6.4 Financial Data Integrity

- `decimal.js` mandatory for all financial calculations
- PostgreSQL `numeric(15,2)` for money columns
- No floating-point arithmetic in financial code paths

---

## 7. Infrastructure & Deployment

### 7.1 Environment Variables

```env
DATABASE_URL=postgresql://...@neon.tech/edara
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-domain.com
```

### 7.2 CI/CD Pipeline

```yaml
# GitHub Actions
steps:
  - pnpm format:check
  - pnpm typecheck
  - pnpm lint --max-warnings 10
  - pnpm build
```

### 7.3 Testing Strategy

| Type | Tool | Convention |
|------|------|-----------|
| Unit | Vitest | `*.test.ts` colocated or `__tests__/` |
| Integration | Vitest | Test oRPC procedures with test DB |
| E2E | Playwright (Phase 2) | Critical user flows |

---

## 8. Business Rules (Appendix)

1. **B1:** Setiap tabel operasional wajib memiliki `school_id`
2. **B2:** Hanya satu tahun pelajaran aktif per unit
3. **B3:** Siswa terdaftar ke kelas melalui tabel `enrollments`
4. **B4:** Status pembayaran dihitung dari agregat transaksi
5. **B5:** Transaksi pembayaran bersifat append-only
6. **B6:** Koreksi pembayaran menggunakan reversal transaction
7. **B7:** Cashflow dari SPP otomatis ter-link dan tidak dapat diedit
8. **B8:** Mata pelajaran guru disimpan sebagai JSON array
9. **B9:** NISN unik per sekolah (bukan global)
10. **B10:** Perubahan status siswa wajib dicatat di history
11. **B11:** Siswa tidak pernah dihapus permanen (soft lifecycle)
12. **B12:** Guru di-soft-delete via `is_active = false`
13. **B13:** Status kegiatan tidak berubah otomatis tanpa instruksi langsung
