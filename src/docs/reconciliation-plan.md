<thinking>
1.  **Analisis Permintaan**: Saya diminta untuk bertindak sebagai AI Engineer yang memecah spesifikasi teknis proyek "EDARA" menjadi rencana tugas (step-wise task plan) yang sangat granular. Tujuannya adalah untuk diberikan kepada AI Coding Assistant agar menghasilkan kode yang akurat, minim bug, dan patuh pada aturan ketat yang ditetapkan (ADR, Project Rules, Audit Report).
2.  **Konteks Utama**:
      * **Aplikasi**: EDARA (SaaS Administrasi Sekolah Multi-tenant).
      * **Stack**: React, Vite (SPA untuk Phase 1), TanStack Router, Zustand, TanStack Query, Tailwind v4, shadcn/ui.
      * **Backend (segera diintegrasikan)**: TanStack Start (API handler), oRPC, Drizzle ORM, Neon PostgreSQL (RLS aktif), pg-boss (colocated), Clerk (Auth).
      * **Masalah Saat Ini (Audit)**: Aplikasi penuh dengan mock data client-side, auth bypass palsu, tidak ada testing, dan ada fitur di luar scope (`ppdb`, `alumni`).
      * **Aturan Kritis**: Wajib `decimal.js` untuk keuangan, transaksi *append-only*, komputasi status SPP secara on-the-fly (ADR-03), log aktivitas terpusat via middleware (ADR-05), dan isolasi tenant via RLS (ADR-02).
3.  **Strategi Pemecahan Tugas**:
      * **Fase 1: Stabilisasi & Infrastruktur (Pembersihan & Setup)**: Hapus mock yang tidak perlu, install dependensi backend yang hilang, setup Vitest.
      * **Fase 2: Layer Database (Schema & RLS)**: Buat schema Drizzle dengan mematuhi batasan ADR (JSON array untuk mata pelajaran, tipe numeric untuk uang). Terapkan RLS policies.
      * **Fase 3: Core Security & API Middleware**: Integrasi Clerk, setup oRPC router dasar, dan buat 3 middleware krusial (Auth/RLS, RBAC, Activity Log).
      * **Fase 4: Job Queue**: Setup pg-boss colocation.
      * **Fase 5 - 10: Migrasi Fitur (Domain-Driven)**: Secara iteratif memindahkan mock data dari Zustand/lokal ke oRPC routers dan memodifikasi komponen React untuk menggunakan `useMutation`/`useQuery` yang sesungguhnya. (Mencakup: Tenant/Auth, Dashboard, Akademik, Guru, Siswa, SPP, Cashflow, Kalender).
4.  **Kontrol Kualitas Format**:
      * Menggunakan format persis seperti yang diminta: `## [Section N]`, `- Step X: [Judul]`, `- **Task**:`, `- **Files**:`, `- **Step Dependencies**:`, `- **User Instructions**:`.
      * Maksimal 15 file per langkah.
      * Setiap langkah harus *self-contained* sehingga build tidak rusak.
      * Instruksi harus eksplisit menyinggung aturan bisnis spesifik (misal: "Jangan gunakan Number, gunakan decimal.js").
</thinking>

Berikut adalah Rencana Tugas Bertahap (Step-wise Task Plan) yang sangat granular untuk proyek EDARA, disusun khusus untuk memandu AI Coding Assistant agar menghasilkan implementasi yang presisi tanpa meninggalkan hutang teknis.

## [Section 1] Stabilisasi Proyek & Infrastruktur Dasar

- Step 1: Pembersihan Fitur Out-of-Scope & Mock Ekstrem
  - **Task**: Menghapus modul `ppdb` dan `alumni` yang berada di luar spesifikasi Phase 1 sesuai Laporan Audit. Menghapus rute yang terkait dari TanStack Router untuk membersihkan _tree_ aplikasi dan mencegah pengembangan fitur yang salah arah.
  - **Files**:
    - `src/features/ppdb/*`: (Delete)
    - `src/features/alumni/*`: (Delete)
    - `src/routes/ppdb.tsx` (atau sejenisnya): (Delete)
    - `src/routes/alumni.tsx` (atau sejenisnya): (Delete)
    - `src/routes/tree.ts` / `src/app/router.tsx`: Hapus referensi rute.
    - `src/components/layout/app-sidebar.tsx`: Hapus navigasi ke PPDB dan Alumni.
  - **Step Dependencies**: Tidak ada.
  - **User Instructions**: Pastikan untuk memeriksa ulang jika ada sisa impor atau komponen yang rusak akibat penghapusan ini. Aplikasi harus dapat di-build dengan sukses setelah langkah ini.

- Step 2: Instalasi Dependensi Backend & Testing
  - **Task**: Menambahkan semua pustaka yang diwajibkan oleh Tech Spec v2.0.0 namun hilang dalam implementasi saat ini. Ini mencakup ORM, RPC, alat keuangan, dan _testing suite_.
  - **Files**:
    - `package.json`: Tambahkan `@clerk/clerk-react`, `@clerk/backend`, `drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless`, `orpc`, `@orpc/react`, `pg-boss`, `decimal.js`, `vitest`, `dotenv`.
    - `vitest.config.ts`: Buat konfigurasi dasar untuk Vitest.
    - `src/lib/decimal-setup.ts`: Buat file inisialisasi awal untuk `decimal.js` (konfigurasi presisi standar).
  - **Step Dependencies**: Step 1
  - **User Instructions**: Jalankan `pnpm install` setelah memperbarui `package.json`. Validasi bahwa Vite dan Vitest dapat berjalan tanpa error.

- Step 3: Setup Koneksi Database & Drizzle Config
  - **Task**: Membangun fondasi koneksi ke database Neon Serverless. Menyiapkan `drizzle.config.ts` untuk manajemen migrasi.
  - **Files**:
    - `.env`: Tambahkan placeholder `DATABASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
    - `drizzle.config.ts`: Setup skema target ke `src/server/db/schema`.
    - `src/server/db/index.ts`: Inisialisasi koneksi `neon` dan instance `drizzle`.
  - **Step Dependencies**: Step 2
  - **User Instructions**: Buat database dev sementara di Neon dan masukkan kredensialnya di `.env.local` Anda agar langkah selanjutnya dapat diuji koneksinya.

## [Section 2] Implementasi Skema Database & RLS (Data Layer)

- Step 4: Skema Core (Tenant, Unit, Academic Years, Users)
  - **Task**: Menulis definisi skema Drizzle untuk entitas fondasional. Menerapkan ADR-02 (Shared Schema) di mana `schoolId` dan `unitId` menjadi indeks wajib.
  - **Files**:
    - `src/server/db/schema/schools.ts`: Tabel `schools` & `school_units`.
    - `src/server/db/schema/users.ts`: Tabel `user_school_assignments` & Enum `user_role`.
    - `src/server/db/schema/academic-years.ts`: Tabel `academic_years`.
    - `src/server/db/schema/index.ts`: Ekspor semua skema.
  - **Step Dependencies**: Step 3
  - **User Instructions**: Pastikan penggunaan `uuid` sebagai primary key dan tambahkan komposit index `(school_id, unit_id)` pada `school_units`.

- Step 5: Skema Personalia & Akademik (Guru, Siswa, Kelas, Enrollments)
  - **Task**: Mendefinisikan tabel untuk operasional sekolah. Memastikan implementasi ADR-06 (`teachers.mataPelajaran` sebagai tipe `jsonb` / teks array, bukan junction table).
  - **Files**:
    - `src/server/db/schema/teachers.ts`: Tabel `teachers`.
    - `src/server/db/schema/students.ts`: Tabel `students` (termasuk Unique Index NISN per school).
    - `src/server/db/schema/classes.ts`: Tabel `classes`.
    - `src/server/db/schema/enrollments.ts`: Tabel `enrollments`, `enrollment_status_history`, dan Enum status.
    - `src/server/db/schema/index.ts`: Tambahkan ekspor baru.
  - **Step Dependencies**: Step 4
  - **User Instructions**: Periksa dengan teliti Unique Constraint pada `enrollments` `(student_id, academic_year_id)` sesuai aturan C6.

- Step 6: Skema Keuangan (SPP, Cashflow) & Log Aktivitas
  - **Task**: Implementasi skema keuangan krusial. WAJIB menggunakan tipe `numeric({ precision: 15, scale: 2 })` untuk seluruh nominal (ADR-07). Implementasi ADR-04 (Tabel `payment_transactions` tanpa `updated_at`).
  - **Files**:
    - `src/server/db/schema/spp.ts`: Tabel kategori, rates, diskon, `payment_bills` (dengan check constraint `billing_month`), `payment_transactions`.
    - `src/server/db/schema/cashflow.ts`: Tabel `cashflow_categories`, `cashflow_transactions` dengan FK ke spp.
    - `src/server/db/schema/logs.ts`: Tabel `activity_logs`.
    - `src/server/db/schema/events.ts`: Tabel `school_events`.
    - `src/server/db/schema/index.ts`: Ekspor final.
  - **Step Dependencies**: Step 5
  - **User Instructions**: Verifikasi bahwa tabel `payment_transactions` TIDAK memiliki izin update. Jalankan `pnpm drizzle-kit generate` setelah langkah ini selesai.

- Step 7: Penerapan Row Level Security (RLS) Policies
  - **Task**: Menulis SQL mentah (atau eksekusi Drizzle) untuk mengaktifkan RLS di database, mencegah kebocoran data antar-unit (ADR-02).
  - **Files**:
    - `src/server/db/migrations/0000_rls_setup.sql`: Berisi `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` dan pembuatan `POLICY tenant_isolation` dan `POLICY unit_isolation` yang bergantung pada `current_setting('app.current_school')`.
  - **Step Dependencies**: Step 6
  - **User Instructions**: Anda harus mengeksekusi file SQL ini secara manual ke database Postgres Anda, atau memastikan ini di-load dalam pipeline migrasi, karena ORM seringkali tidak menangani RLS policies secara otomatis secara sempurna.

## [Section 3] Keamanan, Autentikasi & Middleware Layer

- Step 8: Migrasi Mock Auth ke Clerk Authentication
  - **Task**: Membuang `mock-access-token` dari sisi frontend dan mengimplementasikan `<ClerkProvider>` dengan proteksi rute nyata menggunakan TanStack Router guards.
  - **Files**:
    - `src/app/router.tsx` / `src/routes/__root.tsx`: Bungkus aplikasi dengan `<ClerkProvider>`.
    - `src/features/auth/components/sign-in-form.tsx`: Ganti form kustom dengan `<SignIn>` dari `@clerk/clerk-react`.
    - `src/stores/auth-store.ts`: Hapus store mock, ganti dengan hook utilitas yang membungkus `useAuth()` dan `useUser()` dari Clerk untuk membaca klaim `publicMetadata`.
    - `src/routes/_authenticated.tsx`: Tambahkan validasi session dari Clerk di tingkat router.
  - **Step Dependencies**: Step 2
  - **User Instructions**: Konfigurasikan URL redirect Clerk agar kembali ke `/dashboard` atau halaman pemilihan unit.

- Step 9: Server Middleware - Auth & RLS Context
  - **Task**: Membuat middleware oRPC yang memvalidasi JWT Clerk, mengekstrak custom claims (`schoolId`, `unitId`, `role`), dan meng-inject-nya ke sesi PostgreSQL via perintah `set_config`.
  - **Files**:
    - `src/server/middleware/auth.ts`: Middleware untuk verifikasi JWT via `@clerk/backend`.
    - `src/server/middleware/rls.ts`: Eksekusi `db.execute(sql... set_config(...))` sebelum setiap request database.
    - `src/server/middleware/rbac.ts`: Fungsi `requireRole(['role_name'])` untuk proteksi endpoint.
  - **Step Dependencies**: Step 7, Step 8
  - **User Instructions**: Lakukan _unit test_ sederhana untuk memastikan RLS variables benar-benar di-set sebelum kueri dieksekusi.

- Step 10: Server Middleware - Activity Log Terpusat
  - **Task**: Implementasi ADR-05. Membuat middleware `withActivityLog` yang akan membungkus setiap prosedur mutasi untuk mencatat _audit trail_ secara otomatis.
  - **Files**:
    - `src/server/middleware/activity-log.ts`: Definisi interface `ActivityLogConfig` dan middleware `withActivityLog` yang memasukkan data ke tabel `activity_logs` jika hasil mutasi sukses (`result.ok`).
  - **Step Dependencies**: Step 6, Step 9
  - **User Instructions**: Pastikan middleware ini mengekstrak `entityId` dengan aman meskipun bentuk respons bervariasi.

## [Section 4] API Routing & Background Jobs

- Step 11: Inisiasi oRPC Root Router & TanStack Start Server
  - **Task**: Membuat router utama API yang akan menerima _request_ dari sisi client dan menyiapkannya untuk _consume_ oleh TanStack Query.
  - **Files**:
    - `src/server/routers/index.ts`: File _entry point_ router oRPC utama (menggabungkan sub-router nanti).
    - `src/lib/orpc.ts`: Setup oRPC client yang terhubung dengan endpoint lokal.
    - `src/app/client.tsx`: Bungkus aplikasi dengan `QueryClientProvider` dari `@orpc/react`.
    - `server.ts` (atau handler API Vite yang setara): Setup node server untuk melayani HTTP requests ke oRPC router.
  - **Step Dependencies**: Step 9, Step 10
  - **User Instructions**: Pastikan _endpoint_ API merespons dengan benar tanpa _CORS error_ dalam lingkungan _development_ Vite.

- Step 12: Konfigurasi pg-boss (Colocated Workers)
  - **Task**: Implementasi Aturan C3 (Colocated pg-boss). Menyiapkan antrean pekerjaan di memori yang sama dengan server API untuk Phase 1.
  - **Files**:
    - `src/server/jobs/index.ts`: Inisialisasi instance `PgBoss`, definisikan fungsi `startJobWorkers()`.
    - `server.ts`: Panggil `await pgBoss.start()` dan `startJobWorkers()` pada saat _bootstrap_ server.
  - **Step Dependencies**: Step 11
  - **User Instructions**: pg-boss memerlukan skema sendiri di Postgres, pastikan ia diizinkan membuat tabel `pgboss.*` saat _startup_.

## [Section 5] Migrasi Domain: Multi-Tenant & Dashboard

- Step 13: Store Unit Context & Router Tenant
  - **Task**: Memperbaiki `tenant-store.ts` agar menyinkronkan data dengan Clerk `publicMetadata` dan membuat prosedur sinkronisasi backend.
  - **Files**:
    - `src/stores/tenant-store.ts`: Sinkronisasi status UI dengan `activeUnitId` dari token Clerk.
    - `src/server/routers/users.ts`: Buat prosedur `updateRole` yang memanggil `clerkClient.users.updateUserMetadata()` sesuai Aturan C7.
    - `src/features/auth/components/unit-selector-modal.tsx`: Refactor untuk memanggil mutasi pergantian unit yang memicu penyegaran token Clerk.
  - **Step Dependencies**: Step 8, Step 11
  - **User Instructions**: Ini adalah penghubung kritis antara UI status dan klaim keamanan backend. Uji _login multi-unit_.

- Step 14: Migrasi Dashboard Real-Time API
  - **Task**: Menghapus `sleep()` mock di dashboard, menghubungkannya dengan data aktual.
  - **Files**:
    - `src/server/routers/dashboard.ts`: Buat prosedur agregat statistik (hitung total siswa, tren cashflow via SQL sum, events mendatang, dan tarik data dari `activity_logs`).
    - `src/server/routers/index.ts`: Daftarkan `dashboardRouter`.
    - `src/features/dashboard/hooks/use-dashboard-data.ts`: Ubah agar menggunakan hooks `@orpc/react`.
    - `src/features/dashboard/components/activity-feed.tsx`: Kaitkan ke endpoint log aktivitas.
  - **Step Dependencies**: Step 11, Step 13
  - **User Instructions**: Pastikan grafik cashflow menggunakan Drizzle untuk mem-parsing tipe `numeric` menjadi string terlebih dahulu sebelum diubah ke struktur grafik di client.

## [Section 6] Migrasi Domain: Tahun Pelajaran & Kelas

- Step 15: Modul Tahun Pelajaran & Kunci Aktif
  - **Task**: Mengonversi `tahun-ajaran` dari mock ke server. Implementasikan transaksi khusus: aktivasi tahun ajaran baru harus menonaktifkan tahun lain.
  - **Files**:
    - `src/server/routers/academic-years.ts`: Prosedur CRUD & `activate` (menggunakan _database transaction_).
    - `src/server/routers/index.ts`: Daftarkan router.
    - `src/features/classes/schema.ts` (jika ada schema bersama terkait tahun).
    - Refactor `src/features/academic-years/hooks/use-academic-years.ts` (atau padanannya).
  - **Step Dependencies**: Step 11
  - **User Instructions**: Tangani _Partial Unique Index_ di Drizzle secara eksplisit. Pastikan UI merespons dengan cepat melalui _cache invalidation_ saat tahun aktif berubah.

- Step 16: Modul Kelas & Fitur Kenaikan Massal
  - **Task**: Refactor kelas. Implementasi spesifikasi Kenaikan Kelas (Batch UPDATE enrollments lama ke 'promoted', INSERT enrollment baru).
  - **Files**:
    - `src/server/routers/classes.ts`: Prosedur CRUD & `promoteMassal` (wajib _transaction_).
    - `src/server/routers/index.ts`: Daftarkan.
    - `src/features/classes/components/promote-class-dialog.tsx`: Modifikasi form untuk mengirim array of `studentIds` dan `targetClassId` ke mutasi oRPC.
    - `src/server/middleware/activity-log.ts` (Update): Pastikan aksi `class.promoted_massal` tercatat.
  - **Step Dependencies**: Step 15
  - **User Instructions**: Berikan peringatan warna merah di UI "Aksi ini tidak dapat dibatalkan" sebelum submit.

## [Section 7] Migrasi Domain: Manajemen Guru

- Step 17: Operasional CRUD Guru Dasar
  - **Task**: Memindahkan _mock array_ ke Drizzle queries, menerapkan penyaringan server-side (pencarian ILIKE, status).
  - **Files**:
    - `src/server/routers/teachers.ts`: Prosedur `list` (dengan paginasi & filter), `create` (dengan `withActivityLog`), `update`, `softDelete`.
    - `src/server/routers/index.ts`: Daftarkan.
    - `src/features/teachers/hooks/use-teachers.ts`: Refactor ke oRPC query.
    - `src/features/teachers/components/teacher-form-drawer.tsx`: Hubungkan mutasi form dengan Zod _shared schema_.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Ingat Aturan ADR-06: `mataPelajaran` harus dikirim dan disimpan sebagai JSON Array, bukan tabel relasional.

- Step 18: Bulk Import Guru (Background Job)
  - **Task**: Implementasi _worker_ pg-boss untuk pemrosesan Excel di latar belakang.
  - **Files**:
    - `src/server/routers/teachers.ts`: Tambahkan endpoint `importExecute` yang menaruh _job_ di pg-boss.
    - `src/server/jobs/bulk-import-teachers.ts`: Buat fungsi _worker_ yang mem-parsing file, memvalidasi per baris, dan melakukan INSERT parsial dalam batch.
    - `src/features/teachers/components/teacher-import-dialog.tsx`: Refactor _step indicator_ UI agar melakukan _polling_ status _job_ oRPC.
  - **Step Dependencies**: Step 12, Step 17
  - **User Instructions**: Pemrosesan Excel sebenarnya (parse SheetJS) bisa dilakukan di client, yang dikirim ke server adalah array of JSON objects (aturan _Partial Import_).

## [Section 8] Migrasi Domain: Siklus Siswa (Student Lifecycle)

- Step 19: CRUD Dasar & Pendaftaran Siswa
  - **Task**: Menulis _router_ untuk pendaftaran siswa, yang secara otomatis meng-_enroll_ mereka ke tahun pelajaran dan kelas aktif (membutuhkan _Transaction_).
  - **Files**:
    - `src/server/routers/students.ts`: Prosedur `list`, `getById` (termasuk join tabel `enrollments`), `register` (INSERT ke dua tabel), `update`.
    - `src/server/routers/index.ts`: Daftarkan.
    - `src/features/students/hooks/use-students.ts`: Hubungkan ke oRPC.
    - `src/features/students/components/student-form-drawer.tsx`: Refactor mutasi pendaftaran.
  - **Step Dependencies**: Step 16
  - **User Instructions**: Implementasi logika jika kelas penuh saat mendaftar (peringatan non-blocking di UI, tidak menolak _insert_ di sisi database).

- Step 20: Transisi Status & Detail Siswa
  - **Task**: Implementasi perubahan status individual (Mutasi, Lulus) sesuai Aturan C6 (Satu Enrollment per siswa per tahun, ubah _state_ yang ada, log ke riwayat).
  - **Files**:
    - `src/server/routers/students.ts`: Tambahkan endpoint `changeStatus`.
    - `src/features/students/components/student-profile/index.tsx`: Integrasikan data dari oRPC `getById`.
    - `src/features/students/components/status-change-dialogs/transfer-dialog.tsx`: Kaitkan UI ke mutasi.
    - `src/features/students/components/status-change-dialogs/graduate-dialog.tsx`: Kaitkan UI ke mutasi.
  - **Step Dependencies**: Step 19
  - **User Instructions**: Pastikan status 'transferred_out' dan 'graduated' melakukan pencatatan di `enrollment_status_history` dan `activity_logs`.

## [Section 9] Migrasi Domain: Keuangan & SPP

- Step 21: Tooling Keuangan (decimal.js) & Validator
  - **Task**: Menerapkan ADR-07. Membangun infrastruktur presisi matematika sebelum fitur keuangan dimigrasi.
  - **Files**:
    - `src/lib/validators/finance.ts`: Skema Zod kustom yang mengembalikan string dan memastikan format angka _decimal-safe_.
    - `src/lib/formatters.ts`: Update `formatRupiah` agar menerima string/Decimal secara langsung.
  - **Step Dependencies**: Step 2
  - **User Instructions**: LARANGAN KERAS menggunakan `+` atau `-` bawaan JS pada _service layer_ di langkah-langkah berikutnya.

- Step 22: Konfigurasi & Penagihan SPP (Billing Generation)
  - **Task**: Migrasi penetapan tarif, skema diskon, dan implementasi _Billing Generator_ (kalkulasi Tagihan Bersih) ke sisi server.
  - **Files**:
    - `src/server/routers/spp.ts`: Prosedur `createCategory`, `setRates`, `setDiscount`.
    - `src/server/jobs/generate-bills.ts`: Pekerja pg-boss yang menghasilkan tagihan per bulan berdasarkan tarif kelas dan _lock mechanism_ diskon.
    - `src/features/spp/components/config/class-rates-matrix.tsx`: Refactor form matriks tarif.
    - `src/features/spp/components/config/discount-schemes-table.tsx`: Refactor pengunci skema.
  - **Step Dependencies**: Step 21
  - **User Instructions**: Gunakan `decimal.js` untuk mengkalkulasi `net_amount = base_amount - discount_amount`. Tangani format `VARCHAR(7)` untuk kolom `billing_month` secara eksplisit.

- Step 23: Pencatatan Pembayaran & Reversal (Inti SPP)
  - **Task**: Mengimplementasikan logika `recordPayment` sesuai spesifikasi _append-only_ (ADR-04) dan penanganan otomatis kelebihan bayar (`overpayment`).
  - **Files**:
    - `src/server/routers/spp.ts`: Endpoint `recordPayment` dan `reversePayment` (dengan _activity log_).
    - `src/features/spp/components/record-payment-dialog.tsx`: Modifikasi UI input (kalkulator tagihan dengan Decimal) memanggil mutasi.
    - `src/features/spp/components/reversal-dialog.tsx`: Hubungkan form ke mutasi reversal.
    - `src/features/spp/components/transactions-table.tsx`: Tampilkan visual transaksi tercoret (strikethrough) untuk yang di-_reverse_.
  - **Step Dependencies**: Step 22
  - **User Instructions**: _Database transaction_ sangat krusial di endpoint ini. Verifikasi tidak ada modifikasi pada status selain operasi INSERT pada tabel `payment_transactions`.

- Step 24: Matriks Status SPP Secara Dinamis
  - **Task**: Menghapus logika status _client-side_ yang berat. Menggunakan SQL agregasi (ADR-03) untuk menentukan warna sel matriks langsung dari database.
  - **Files**:
    - `src/server/routers/spp.ts`: Endpoint `getPaymentMatrix` dan `getArrears` (Tunggakan).
    - `src/features/spp/components/payment-matrix.tsx`: Refactor agar murni membaca data server yang sudah diagregasi menjadi array tipe status.
    - `src/features/spp/components/arrears-table.tsx`: Kaitkan ke endpoint `getArrears`.
  - **Step Dependencies**: Step 23
  - **User Instructions**: Query SQL di server harus menggunakan `GROUP BY` dan klausa `CASE WHEN` yang persis sama dengan dokumen ADR-03.

- Step 25: Migrasi Manajemen Cashflow & Auto-Link SPP
  - **Task**: Memindahkan fitur _Cashflow_ ke backend. Menambahkan fungsionalitas auto-link, di mana pembayaran SPP akan membuat record otomatis yang tidak bisa diedit via modul _Cashflow_.
  - **Files**:
    - `src/server/routers/cashflow.ts`: Prosedur `listTransactions`, `createTransaction` (dengan pengecekan tipe), `getCategories`.
    - `src/server/routers/spp.ts` (Update): Tambahkan `INSERT` ke tabel `cashflow_transactions` dalam _transaction block_ prosedur `recordPayment`.
    - `src/features/cashflow/components/transactions-table.tsx`: Hapus opsi edit/hapus pada UI jika `sppPaymentId` terisi.
    - `src/features/cashflow/hooks/use-cashflow.ts`: Hubungkan ke oRPC.
  - **Step Dependencies**: Step 24
  - **User Instructions**: Transaksi SPP yang otomatis di-_link_ harus menggunakan akun/kategori cashflow standar yang otomatis dibuat jika belum ada.

## [Section 10] Migrasi Domain: Kalender & Ekspor

- Step 26: Migrasi Kalender Kegiatan & Summary Cards
  - **Task**: Menghubungkan modul _Events_ dari React Big Calendar dan UI _DataTable_ ke server. Memastikan komputasi metrik (_dibatalkan_, _lomba_) terjadi di server.
  - **Files**:
    - `src/server/routers/events.ts`: Prosedur CRUD kegiatan, pembatalan, dan `getSummaryStats`.
    - `src/server/routers/index.ts`: Daftarkan router kegiatan.
    - `src/features/events/components/events-calendar.tsx`: Hubungkan _fetching_ rentang bulan kalender.
    - `src/features/events/components/events-summary-cards.tsx`: Gunakan hasil agregat endpoint `getSummaryStats`.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Ingat bahwa kegiatan yang sudah lampau _tidak_ otomatis berubah menjadi selesai (Sesuai Aturan B13) – pertahankan status secara harfiah di database.

- Step 27: Implementasi Job Generator Laporan (Finalisasi)
  - **Task**: Setup _report generator_ (PDF/Excel) menggunakan pg-boss agar ekspor data besar tidak memblokir antarmuka pengguna.
  - **Files**:
    - `src/server/jobs/generate-excel-report.ts`: Buat utilitas ExcelJS untuk laporan tunggakan/cashflow.
    - `src/server/routers/reports.ts`: Buat endpoint yang menaruh permintaan ke pg-boss dan mengembalikan `jobId`.
    - `src/features/shared/components/export-button.tsx` (atau sejenisnya): Komponen standar untuk me-_trigger_ ekspor dan memantau status _polling_.
  - **Step Dependencies**: Step 12, Step 24, Step 25
  - **User Instructions**: Karena file ekspor harus dikirim kembali ke pengguna (browser), simpan hasilnya sementara sebagai tautan yang dapat diunduh, atau kembalikan _base64/buffer_ jika laporan cukup kecil (tergantung implementasi cloud storage/buffer di Phase 1).

\</thinking\>

Berikut adalah Rencana Tugas Bertahap (_Step-wise Task Plan_) yang sangat mendetail untuk proyek **EDARA**. Rencana ini dirancang secara berurutan agar aplikasi dapat terus berjalan _(buildable)_ di setiap pergantian langkah, dengan transisi aman dari arsitektur _Mock/Vite SPA_ menuju spesifikasi final _TanStack Start + oRPC + Drizzle ORM_.

---

## [Section 1] Stabilisasi & Infrastruktur Dasar

Fase ini berfokus pada membersihkan fitur yang keluar dari spesifikasi (sebagaimana temuan Laporan Audit) dan menyiapkan instrumen _backend_ dan _testing_.

- Step 1: Pembersihan Fitur _Out-of-Scope_ & Rute
  - **Task**: Menghapus modul `ppdb` (Penerimaan Siswa) dan `alumni` yang dibangun di luar batasan Phase 1. Membersihkan navigasi agar aplikasi difokuskan pada MVP inti.
  - **Files**:
    - `src/features/ppdb/*`: (Hapus seluruh folder)
    - `src/features/alumni/*`: (Hapus seluruh folder)
    - `src/routes/ppdb.tsx` (atau yang setara): (Hapus)
    - `src/routes/alumni.tsx` (atau yang setara): (Hapus)
    - `src/app/router.tsx` / `src/routes/tree.ts`: Hapus rute yang mereferensikan PPDB dan Alumni.
    - `src/components/layout/app-sidebar.tsx`: Hapus _link_ navigasi di UI _sidebar_.
  - **Step Dependencies**: Tidak ada
  - **User Instructions**: Pastikan untuk memeriksa pesan _error_ linting setelah penghapusan. Aplikasi harus dapat dikompilasi ulang tanpa error sebelum melangkah ke tahap instalasi.

- Step 2: Instalasi Dependensi Backend & _Testing_
  - **Task**: Memperbarui proyek dengan dependensi wajib sesuai spesifikasi teknis (ORM, RPC, Auth, Keuangan presisi tinggi, dan utilitas _testing_).
  - **Files**:
    - `package.json`: Tambahkan paket `@clerk/clerk-react`, `@clerk/backend`, `drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless`, `orpc`, `@orpc/react`, `pg-boss`, `decimal.js`, `vitest`, `dotenv`.
    - `vitest.config.ts`: Buat konfigurasi standar untuk inisiasi lingkungan _testing_.
    - `src/lib/decimal-setup.ts`: Buat file setup untuk `decimal.js` (misal menetapkan presisi awal yang konsisten untuk perhitungan keuangan).
  - **Step Dependencies**: Step 1
  - **User Instructions**: Jalankan `pnpm install`. Pastikan Vitest dapat merender _test_ kosong pertama tanpa gagal.

- Step 3: Konfigurasi Database & Drizzle ORM
  - **Task**: Menghubungkan aplikasi ke Neon Serverless PostgreSQL dan mengatur Drizzle ORM agar _schema_ dan migrasi dapat diatur dengan baik.
  - **Files**:
    - `.env`: Tambahkan struktur _placeholder_ untuk `DATABASE_URL` dan _keys_ Clerk.
    - `drizzle.config.ts`: Arahkan properti `schema` ke direktori `src/server/db/schema` dan properti koneksi ke file variabel lingkungan.
    - `src/server/db/index.ts`: Inisialisasi koneksi Postgres Neon dan instance Drizzle ORM.
  - **Step Dependencies**: Step 2
  - **User Instructions**: Siapkan database dev di Neon. Masukkan kredensialnya ke `.env.local` lokal Anda untuk memastikan koneksi dapat dibangun.

## [Section 2] Implementasi Skema Database & RLS

Menerjemahkan dokumen ERD spesifikasi teknis langsung ke kode Drizzle dengan mematuhi aturan ketat _Multi-Tenant_ dan _Append-Only_.

- Step 4: Definisi Skema Inti (Tenant, Unit, Tahun Ajaran)
  - **Task**: Membuat tabel `schools`, `school_units`, `academic_years`, dan penugasan RBAC untuk _user_. Mengimplementasikan ADR-02 (Shared Schema) di mana indeks wajib digunakan pada `school_id` dan `unit_id`.
  - **Files**:
    - `src/server/db/schema/schools.ts`: Definisi tabel `schools` dan `school_units` lengkap dengan _composite index_.
    - `src/server/db/schema/users.ts`: Definisi tabel `user_school_assignments` dan enum `user_role`.
    - `src/server/db/schema/academic-years.ts`: Definisi tabel `academic_years`.
    - `src/server/db/schema/index.ts`: Ekspor seluruh tabel ke dalam satu _barrel file_.
  - **Step Dependencies**: Step 3
  - **User Instructions**: Gunakan pola UUID untuk primary key. Pada `academic_years`, jangan mencoba membuat _partial unique index_ murni dengan Drizzle jika sulit—kita akan menulisnya di SQL raw.

- Step 5: Definisi Skema Operasional (Guru, Siswa, Kelas, Enrollment)
  - **Task**: Membuat skema Personalia dan Siswa. Menerapkan ADR-06 (`mataPelajaran` harus didefinisikan sebagai tipe teks yang memuat array JSON) dan aturan C6 pada enrollments.
  - **Files**:
    - `src/server/db/schema/teachers.ts`: Definisi `teachers` (menggunakan JSON string `mataPelajaran`).
    - `src/server/db/schema/students.ts`: Definisi `students` (dengan _unique index_ NISN yang di-_scope_ berdasarkan `schoolId`).
    - `src/server/db/schema/classes.ts`: Definisi `classes`.
    - `src/server/db/schema/enrollments.ts`: Definisi `enrollments`, `enrollment_status_history`, dan enumerasi status relevan.
    - `src/server/db/schema/index.ts`: Tambahkan _exports_.
  - **Step Dependencies**: Step 4
  - **User Instructions**: Ingat Aturan B11: Siswa tidak pernah dihapus secara permanen, guru di-_soft-delete_ (`is_active`).

- Step 6: Definisi Skema Finansial & Log (SPP, Cashflow, Events)
  - **Task**: Mengimplementasikan tabel keuangan krusial dan audit _logs_. **Kritis**: Aturan ADR-07 Mewajibkan setiap kolom uang menggunakan tipe `numeric({ precision: 15, scale: 2 })`. Mengimplementasikan ADR-04 di tabel transaksi SPP (tanpa _update/delete_).
  - **Files**:
    - `src/server/db/schema/spp.ts`: Tabel billing (dengan Regex Check), transaksi SPP (tanpa `updated_at`), kategori pembayaran.
    - `src/server/db/schema/cashflow.ts`: Tabel cashflow yang memiliki _Foreign Key_ opsional ke `sppPaymentId`.
    - `src/server/db/schema/logs.ts`: Tabel `activity_logs`.
    - `src/server/db/schema/events.ts`: Tabel `school_events`.
    - `src/server/db/schema/index.ts`: Tambahkan _exports_ final.
  - **Step Dependencies**: Step 5
  - **User Instructions**: Jangan sertakan kolom `status` pada `payment_bills` untuk status lunas/sebagian. Jalankan `pnpm drizzle-kit generate` setelah langkah ini.

- Step 7: Penerapan Row Level Security (RLS) Database
  - **Task**: Menulis migrasi SQL _raw_ untuk mengaktifkan kebijakan isolasi tenant _multi-tenant_ di basis data secara langsung.
  - **Files**:
    - `src/server/db/migrations/0000_rls_setup.sql`: Buat perintah `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` untuk semua tabel operasional, beserta _POLICY_ isolasinya yang memeriksa `current_setting('app.current_school')`.
  - **Step Dependencies**: Step 6
  - **User Instructions**: Lakukan _push_ migrasi SQL ini secara manual. ORM sering tidak mengeksekusi migrasi mentah (RLS) tanpa bantuan eksekutor spesifik jika menggunakan _branch_ Neon.

## [Section 3] Middleware Keamanan, Autentikasi & API Dasar

Mengganti sistem masuk (login) _mock_ dari sisi klien dengan perlindungan nyata dari layanan autentikasi Clerk dan menghubungkannya dengan API router lokal (oRPC).

- Step 8: Integrasi Clerk Authentication & Route Guards
  - **Task**: Membuang `mock-access-token` dan menyelimuti lapisan luar _routing_ UI dengan layanan sesi asli dari Clerk.
  - **Files**:
    - `src/routes/__root.tsx` (atau `src/app/router.tsx`): Bungkus _provider_ utama dengan `<ClerkProvider>`.
    - `src/features/auth/components/sign-in-form.tsx`: Ganti form UI manual dengan pemanggilan ke komponen `<SignIn>` dari Clerk.
    - `src/stores/auth-store.ts`: Hapus isi tiruan _(mock)_ sepenuhnya; ganti dengan utilitas sederhana pembungkus hook Clerk (`useUser`, `useAuth`) untuk membaca `publicMetadata`.
    - `src/routes/_authenticated.tsx`: Minta router untuk mengalihkan rute ke halaman `/sign-in` jika pengguna belum memiliki _session_ yang valid.
  - **Step Dependencies**: Step 2
  - **User Instructions**: Konfigurasikan halaman pemilih _tenant/unit_ sebagai destinasi setelah login jika pengguna memiliki _multi-unit_.

- Step 9: Middleware Server untuk Konteks Autentikasi & RLS
  - **Task**: Membuat lapisan perlindungan (middleware oRPC) yang mencegat permintaan _(request)_ API, memverifikasi token JWT via SDK _backend_ Clerk, dan menyuntikkan ID pengguna ke sesi _database_ PostgreSQL.
  - **Files**:
    - `src/server/middleware/auth.ts`: Middleware pemverifikasi _Clerk JWT_.
    - `src/server/middleware/rls.ts`: Fungsi yang memanggil perintah `db.execute(sql... set_config(...))` sebelum kueri dilakukan untuk menjamin filter RLS berjalan.
    - `src/server/middleware/rbac.ts`: Fungsi _guard_ peran (contoh: `requireRole(['bendahara', 'super_admin'])`).
  - **Step Dependencies**: Step 7, Step 8
  - **User Instructions**: Jika permintaan gagal memverifikasi JWT, segera lemparkan _ORPCError_ (misal: `UNAUTHORIZED`).

- Step 10: Middleware Pencatatan Log Aktivitas Terpusat
  - **Task**: Implementasi ADR-05. Membuat sistem pencatatan otomatis (_intercepting middleware_) yang menangkap hasil berhasilnya sebuah mutasi, lalu menyisipkannya ke `activity_logs`.
  - **Files**:
    - `src/server/middleware/activity-log.ts`: Definisikan `ActivityLogConfig` dan bangun fungsi `withActivityLog` yang mengambil _input_, _result_, dan konteks _user_.
  - **Step Dependencies**: Step 6, Step 9
  - **User Instructions**: Pastikan middleware ini cukup dinamis agar para developer dapat memberikan fungsi pelacakan ID sumber (contoh: `getEntityId: (result) => result.id`) dalam setiap titik mutasi (_endpoint_).

## [Section 4] Inisialisasi API Router & Job Workers

Menata pelayan API lokal agar UI _(frontend)_ dan server dapat berkomunikasi tanpa batasan.

- Step 11: Setup oRPC Root Router & TanStack Start (Mode SPA)
  - **Task**: Mengonfigurasi `oRPC` untuk memanajemen prosedur pemanggilan _(remote procedures)_, dan membuat server handler untuk Vite (atau Node API dasar jika berjalan _standalone_).
  - **Files**:
    - `src/server/routers/index.ts`: Inisialisasi `appRouter` utama dan kaitkan middleware keamanan dari langkah sebelumnya.
    - `src/lib/orpc.ts`: Buat instansiasi oRPC client untuk digunakan _frontend_.
    - `src/app/client.tsx`: Masukkan _QueryClientProvider_ berbasis `orpc` mengelilingi aplikasi React.
    - `server.ts` (atau file _entry_ handler API Anda): Ikat router oRPC ke port/server HTTP.
  - **Step Dependencies**: Step 9, Step 10
  - **User Instructions**: Pastikan _frontend_ menggunakan skema `fetch` standar via orpc-client untuk mengirim header `Authorization: Bearer <token_clerk>`.

- Step 12: Konfigurasi Background Job `pg-boss` (Colocated)
  - **Task**: Menerapkan Keputusan C3 dengan menghidupkan _job queue_ PostgreSQL pada proses memori server yang sama untuk pemrosesan asinkron ringan di Phase 1.
  - **Files**:
    - `src/server/jobs/index.ts`: Definisikan _bootstrap_ instansiasi `PgBoss` dengan `schema: "pgboss"`. Buat fungsi ekspor `startJobWorkers()`.
    - `server.ts`: Integrasikan pemanggilan asinkron `await pgBoss.start()` bersamaan dengan jalannya server HTTP.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Pekerja _job_ ini kelak akan digunakan untuk pengunduhan laporan besar dan _bulk-import_. Biarkan daftarnya kosong untuk sementara.

## [Section 5] Migrasi Domain: Konteks & Dashboard

Fokus memindahkan status penyajian UI aplikasi dan analitik utama dari data tiruan ke server nyata.

- Step 13: Migrasi _Unit Context_ & Router User
  - **Task**: Menulis prosedur sinkronisasi hak peran (_role_) dan mengganti logika peralihan unit _mock_ di sisi _frontend_ dengan mekanisme JWT otentik.
  - **Files**:
    - `src/stores/tenant-store.ts`: Sesuaikan agar `activeUnitId` menjadi cermin sinkron dari metadata token Clerk.
    - `src/server/routers/users.ts`: Buat prosedur mutasi `updateRole` yang melakukan API call ke sisi server Clerk (ADR-07).
    - `src/features/auth/components/unit-selector-modal.tsx`: Refaktorisasi agar menekan mekanisme pembaruan token Clerk (_refresh_) usai memilih unit.
  - **Step Dependencies**: Step 8, Step 11
  - **User Instructions**: Ini sangat krusial. Pastikan token dikembalikan (di-_refresh_) saat pengguna mengubah unit, karena data sesi `activeUnitId` pada token digunakan di level database.

- Step 14: Restrukturisasi API Dashboard Real-Time
  - **Task**: Menggantikan simulasi jeda `sleep()` dan kumpulan array fiktif dengan kueri agregasi komprehensif pada database langsung.
  - **Files**:
    - `src/server/routers/dashboard.ts`: Buat prosedur untuk mendapatkan jumlah siswa/guru aktif, penarikan _activity_logs_, dan kalkulasi total uang untuk grafik arus kas.
    - `src/server/routers/index.ts`: Tambahkan `dashboardRouter`.
    - `src/features/dashboard/hooks/use-dashboard-data.ts`: Gantikan permintaan tiruan dengan fungsi kait `useQuery` dari router oRPC.
    - `src/features/dashboard/components/activity-feed.tsx`: Pasang _binding_ variabel baru secara langsung.
  - **Step Dependencies**: Step 11, Step 13
  - **User Instructions**: Untuk grafik _cashflow_, komputasikan hasil pada sisi server terlebih dulu sehingga klien hanya merender grafik final.

## [Section 6] Migrasi Domain: Akademik Inti (Tahun Ajaran & Kelas)

- Step 15: Konversi Tahun Pelajaran & Logika Aktivasi
  - **Task**: Membuat _endpoints_ untuk tahun pelajaran. Menulis transaksi eksklusif `activate` yang mencabut status aktif pada entitas lain dan menetapkannya di satu rekor.
  - **Files**:
    - `src/server/routers/academic-years.ts`: Prosedur CRUD & `activate` (menggunakan blok `db.transaction`).
    - `src/server/routers/index.ts`: Tambahkan `academicYearsRouter`.
    - `src/features/academic-years/hooks/use-academic-years.ts` (atau padanan komponen): Ubah penggunaan status _mock_ ke mutasi oRPC.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Transaksi wajib digunakan di fungsi `activate` agar pangkalan data tidak memiliki jeda sesaat yang diisi dua _active year_ bersamaan.

- Step 16: Migrasi Kelas & Prosedur Kenaikan Massal
  - **Task**: Memindahkan logika manajemen Kelas, dan yang paling kritikal, fitur **Kenaikan Kelas Massal**. Mutasi harus menavigasikan pembaruan banyak pendaftaran (enrollments) dengan _transaction block_.
  - **Files**:
    - `src/server/routers/classes.ts`: CRUD Kelas dan _endpoint_ aksi besar `promoteMassal`.
    - `src/server/routers/index.ts`: Tambahkan `classesRouter`.
    - `src/features/classes/components/promote-class-dialog.tsx`: Sambungkan UI _checkbox_ massal dengan input oRPC yang mengambil daftar _array_ ID Siswa.
  - **Step Dependencies**: Step 15
  - **User Instructions**: Pastikan penggunaan `withActivityLog` dicantumkan di prosedur `promoteMassal` untuk mencatat jumlah siswa yang dipindahkan.

## [Section 7] Migrasi Domain: Sumber Daya Manusia (Guru)

- Step 17: Operasional Utama CRUD Guru
  - **Task**: Menyelesaikan logika formulir tambah/sunting, status penonaktifan secara halus _(soft-delete)_, dan paginasi daftar pencarian berbasis penyaringan _server-side_.
  - **Files**:
    - `src/server/routers/teachers.ts`: Prosedur list, mutasi `create`, `update`, `deactivate`.
    - `src/server/routers/index.ts`: Tambahkan `teachersRouter`.
    - `src/features/teachers/hooks/use-teachers.ts`: Refaktorisasi ke mutasi `oRPC`.
    - `src/features/teachers/components/teacher-form-drawer.tsx`: Pasang _form hook_ dan _Zod resolver_ secara langsung ke mutasi.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Ingat ADR-06; Jangan buat tabel tambahan untuk mata pelajaran. Simpan dan kirim ke _endpoint_ secara natural menggunakan struktur array string (JSON).

- Step 18: Pengunggahan Borongan (_Bulk Import_) Eksekusi Guru
  - **Task**: Membuat fungsionalitas impor besar (Excel) di latar belakang (Phase 1 pg-boss colocation).
  - **Files**:
    - `src/server/jobs/bulk-import-teachers.ts`: Pekerja `pg-boss` spesifik untuk melakukan interogasi _SheetJS_, menyaring per-baris, dan _insert_ baris sukses.
    - `src/server/routers/teachers.ts`: Sisipkan prosedur `importExecute` yang menempatkan data mentah array dari baris _valid_ ke dalam antrean (job).
    - `src/features/teachers/components/teacher-import-dialog.tsx`: Modifikasi status muatan menjadi pemicu siklus _polling_ kueri ke status pg-boss.
  - **Step Dependencies**: Step 12, Step 17
  - **User Instructions**: Pratinjau (_preview_) tetap berada di klien untuk _User Experience_ cepat. Hanya array baris bersih (sudah divalidasi dan di-_highlight_ oleh klien) yang dibuang ke antrean pg-boss.

## [Section 8] Migrasi Domain: Siswa & Rekam Jejak (Student Lifecycle)

- Step 19: Pendaftaran Siswa Baru (_Registration Flow_)
  - **Task**: Membuat proses ganda dalam satu klik; Mendaftarkan rekam jejak primer Siswa (identitas) bersamaan dengan inisiasi pendaftaran ke tahun akademik dan kelas aktif.
  - **Files**:
    - `src/server/routers/students.ts`: Endpoint `register` (transaksi ganda ke tabel `students` & `enrollments`), `list`, `getById`.
    - `src/server/routers/index.ts`: Tambahkan `studentsRouter`.
    - `src/features/students/hooks/use-students.ts`: Refaktorisasi ke oRPC.
    - `src/features/students/components/student-form-drawer.tsx`: Modifikasi mutasi pendaftaran.
  - **Step Dependencies**: Step 16
  - **User Instructions**: Pendaftaran ini sangat sensitif terhadap Tahun Pelajaran Aktif. Panggil variabel kontekstual tahun ajaran pada server secara langsung.

- Step 20: Alih Status, Kelulusan, & Mutasi Siswa
  - **Task**: Implementasi perubahan status (ADR Aturan C6). Mengganti ID Kelas atau mengubah status keluar yang diwajibkan menulis di tabel histori.
  - **Files**:
    - `src/server/routers/students.ts`: Sisipkan prosedur `changeStatus` yang membutuhkan `metadata` tambahan (sekolah tujuan, dsb.).
    - `src/features/students/components/student-profile/index.tsx`: Tarik data dari server nyata untuk Tab profil dan rekaman riwayat.
    - `src/features/students/components/status-change-dialogs/transfer-dialog.tsx`: Ganti panggilan buatan dengan fungsi oRPC.
    - `src/features/students/components/status-change-dialogs/graduate-dialog.tsx`: (Sama dengan di atas).
  - **Step Dependencies**: Step 19
  - **User Instructions**: Pastikan Mutasi dan Kelulusan memicu `withActivityLog` untuk _compliance_ keamanan. Siswa terkeluarkan tidak dihapus datanya dari UI, tetapi ditandai secara visual.

## [Section 9] Migrasi Domain: SPP & Keuangan Kritis

Ini adalah sesi paling kompleks karena ketatnya _constraint_ kepresisian matematika. **(Perhatian: ADR-07 - Wajib Penggunaan decimal.js).**

- Step 21: Tooling Keuangan & Restrukturisasi Formatter
  - **Task**: Mengimplementasikan basis alat `decimal.js` secara mendalam. Menyingkirkan tipe data `Number` standar di bagian _service_ pengkalkulasi tagihan.
  - **Files**:
    - `src/lib/validators/finance.ts`: Buat skema _Zod_ validasi khusus yang menyerap `number/string` dari UI dan mengekspor nilainya sebagai string format _decimal-safe_.
    - `src/lib/formatters.ts`: Modifikasi `formatRupiah` agar menerima ekstensi `Decimal`.
  - **Step Dependencies**: Step 2
  - **User Instructions**: Jika AI menemukan kalkulasi seperti `amount - discount` menggunakan metode dasar JS dalam mutasi, blokir keras dan gunakan fitur fungsional `.minus()`, `.times()`.

- Step 22: Pengaturan Tagihan & Penguncian Diskon SPP
  - **Task**: Migrasi penyesuaian tarif SPP dan skema subsidi per siswa. Skema subsidi otomatis mengunci _is_locked_ di pertengahan tahun berjalan.
  - **Files**:
    - `src/server/routers/spp.ts`: Prosedur `createCategory`, `setRates`, dan `setDiscountScheme`.
    - `src/server/jobs/generate-bills.ts`: Buat pekerja (job) `pg-boss` untuk menyebarkan dokumen `payment_bills` berkala di awal waktu.
    - `src/features/spp/components/config/class-rates-matrix.tsx`: Menarik tabel referensi harga aktual dari mutasi oRPC.
    - `src/features/spp/components/config/discount-schemes-table.tsx`: Aktifkan ikon 'Terkunci 🔒' pada antarmuka bagi subsidi yang tak bisa diakses.
  - **Step Dependencies**: Step 21
  - **User Instructions**: Cek panjang kolom teks `billing_month` secara paksa (contoh regex Zod `"YYYY-MM"`) di validasi input SPP.

- Step 23: Pencatatan Pembayaran & Reversal (Inti Operasional)
  - **Task**: Pengimplementasian prosedur catatan bayar _append-only_ (ADR-04) yang secara otomatis akan menangkap kelebihan pembayaran (`overpayment`) di transaksi kedua.
  - **Files**:
    - `src/server/routers/spp.ts`: Endpoint `recordPayment` dan endpoint `reversePayment` yang saling berelasi pada ID transaksi (`reversedById`).
    - `src/features/spp/components/record-payment-dialog.tsx`: Modifikasi fungsi masukan di dialog agar langsung menjalankan oRPC dan menangkap jumlah _overpayment_.
    - `src/features/spp/components/reversal-dialog.tsx`: Bind langsung mutasi reversal, mewajibkan kolom alasan di UI.
    - `src/features/spp/components/transactions-table.tsx`: Tarik data kueri nyata dan beri corat (strikethrough) gaya visual bagi mutasi ter-_reverse_.
  - **Step Dependencies**: Step 22
  - **User Instructions**: Jangan buat kolom status pembatalan, selalu sisipkan transaksi rekor baru ke `payment_transactions` yang dikurasi oleh middleware catat kegiatan (_Activity Log_).

- Step 24: Migrasi Matriks Tunggakan Secara Dinamis
  - **Task**: Menghilangkan komputasi lunas/sebagian yang dimuat ke status klien. Sepenuhnya menyalin _Raw SQL Query_ (ADR-03) ke peladen backend Drizzle.
  - **Files**:
    - `src/server/routers/spp.ts`: Buat endpoint `getPaymentMatrix` dan `getArrears` yang hanya menyiarkan blok status string siap-pakai dan ringkasan defisit.
    - `src/features/spp/components/payment-matrix.tsx`: Sapu hapus _useMemo_ kompleks; panggil dan tampilkan matriks hasil olahan data server begitu saja.
    - `src/features/spp/components/arrears-table.tsx`: Kaitkan data asli ke tabel UI sisa tagihan.
  - **Step Dependencies**: Step 23
  - **User Instructions**: Gunakan metode eksekusi parameter SQL bawaan di Drizzle untuk mendedah `CASE WHEN... THEN 'paid' ELSE 'partial'` persis seperti di ADR-03.

- Step 25: Integrasi Cashflow & _Auto-Link_ Pembayaran
  - **Task**: Menyusun prosedur laporan arus kas. Memastikan setiap transaksi `recordPayment` pada SPP secara atomik mengunggah duplikat _read-only_ ke catatan `cashflow_transactions` pada _transaction block_ yang sama.
  - **Files**:
    - `src/server/routers/cashflow.ts`: Prosedur CRUD kategori dan entri riwayat _cashflow_.
    - `src/server/routers/spp.ts` (Update): Buka _transaction block_ `recordPayment` lalu sisipkan pemanggilan _insert_ ke `cashflow_transactions` bersamaan dengan simpan SPP.
    - `src/features/cashflow/components/transactions-table.tsx`: Modifikasi aksi baris; hilangkan menu ubah/hapus dari tombol _dropdown_ bila entri itu memiliki kolom `sppPaymentId` (auto-linked).
    - `src/features/cashflow/hooks/use-cashflow.ts`: Transformasi kode lama ke kueri nyata oRPC.
  - **Step Dependencies**: Step 24
  - **User Instructions**: Di Cashflow, pengeluaran atau pendapatan _Auto-Link_ hanya dapat ditelusuri atau dilihat rincian SPP aslinya — jangan pasang _endpoint_ hapus bagi mereka.

## [Section 10] Migrasi Domain: Kalender & Modul Ekspor

- Step 26: Migrasi Kalender & Komputasi Event Card
  - **Task**: Integrasikan CRUD UI Kegiatan Sekolah (_School Events_) ke oRPC. Memindahkan kalkulasi metrik panel agregat ke basis data untuk mendapatkan hitungan yang sesungguhnya.
  - **Files**:
    - `src/server/routers/events.ts`: Buat prosedur list, mutasi aksi, dan `getSummaryStats` (Jumlah batal, jumlah lomba).
    - `src/server/routers/index.ts`: Tambahkan `eventsRouter`.
    - `src/features/events/components/events-calendar.tsx`: Menautkan navigasi bulan ke kueri batas rentang tanggal API.
    - `src/features/events/components/events-summary-cards.tsx`: Singkirkan perhitungan lokal dan pasang nilai kembalian dari endpoint agregasi.
  - **Step Dependencies**: Step 11
  - **User Instructions**: Pastikan tabel events merender nilai aslinya, status kegiatan lawas tidak berubah ke 'selesai' dengan otomatis via rutinitas tanpa instruksi langsung (Aturan B13).

- Step 27: Infrastruktur Pengekspor Laporan (pg-boss Generator)
  - **Task**: Mengeksekusi penarikan data borongan yang diolah menjadi berkas Excel/PDF dari latar belakang melalui penugasan _(Job workers)_ untuk efisiensi RAM antarmuka.
  - **Files**:
    - `src/server/jobs/generate-excel-report.ts`: Tulis modul pengisi baris _ExcelJS_ berdasarkan variabel tipe laporan (SPP/Cashflow).
    - `src/server/routers/reports.ts`: Bangun endpoint _RPC_ guna memicu _Job_, serta endpoint cek status/unduh untuk mengambil data hasil olahan (Blob/Base64).
    - `src/features/shared/components/export-button.tsx` (atau setara): Perbarui komponen UI tombol Ekspor menjadi alur yang memberikan notifikasi _toast_ selama mesin bekerja dan memanggil pengunduhan kala selesai.
  - **Step Dependencies**: Step 12, Step 24, Step 25
  - **User Instructions**: Jika utilitas pengiriman tautan file unduhan sulit diimplementasikan di Phase 1 tanpa kompartemen _Storage Cloud_ (S3), Anda dapat mengirimkan respons _buffer base64_ ringan langsung dari pg-boss ke klien bila memori menyanggupi. Memastikan aliran pengguna tidak membeku.
