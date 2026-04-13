---
name: reconciliation-plan
description: Reconciliation Plan for EDARA
status: draft
modified: 2026-04-12
version: 1.2.0
---

# Edara Rencana Implementasi dan Rekonsiliasi

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
  - **Prerequisites**: Pastikan `git status` bersih (clean branch). Tidak ada modifikasi berjalan.
  - **Rollback / Error Handling**: Lakukan `git restore .` jika aplikasi rusak parah sehingga gagal di-build.
  - **User Instructions**: Pastikan untuk memeriksa pesan _error_ linting setelah penghapusan. Aplikasi harus dapat dikompilasi ulang tanpa error sebelum melangkah ke tahap instalasi.

- Step 2: Instalasi Dependensi Backend & _Testing_
  - **Task**: Memperbarui proyek dengan dependensi wajib sesuai spesifikasi teknis (ORM, RPC, Auth, Keuangan presisi tinggi, dan utilitas _testing_).
  - **Files**:
    - `package.json`: Tambahkan paket `@clerk/clerk-react`, `@clerk/backend`, `drizzle-orm`, `drizzle-kit`, `pg`, `@neondatabase/serverless`, `orpc`, `@orpc/react`, `pg-boss`, `decimal.js`, `vitest`, `dotenv`.
    - `vitest.config.ts`: Buat konfigurasi standar untuk inisiasi lingkungan _testing_.
    - `src/lib/decimal-setup.ts`: Buat file setup untuk `decimal.js` (misal menetapkan presisi awal yang konsisten untuk perhitungan keuangan).
  - **Step Dependencies**: Step 1
  - **Prerequisites**: Koneksi internet stabil untuk unduh NPM packages.
  - **Rollback / Error Handling**: Hapus `node_modules` & `pnpm-lock.yaml`, lalu jalankan `pnpm install` ulang jika terjadi konflik versi.
  - **User Instructions**: Jalankan `pnpm install`. Pastikan Vitest dapat merender _test_ kosong pertama tanpa gagal.

- Step 3: Konfigurasi Database & Drizzle ORM
  - **Task**: Menghubungkan aplikasi ke Neon Serverless PostgreSQL dan mengatur Drizzle ORM agar _schema_ dan migrasi dapat diatur dengan baik.
  - **Files**:
    - `.env`: Tambahkan struktur _placeholder_ untuk `DATABASE_URL` dan _keys_ Clerk.
    - `drizzle.config.ts`: Arahkan properti `schema` ke direktori `src/server/db/schema` dan properti koneksi ke file variabel lingkungan.
    - `src/server/db/index.ts`: Inisialisasi koneksi Postgres Neon dan instance Drizzle ORM.
  - **Step Dependencies**: Step 2
  - **Prerequisites**: Siapkan kredensial `DATABASE_URL` dari console Neon.
  - **Rollback / Error Handling**: Jangan ubah kode Drizzle. Periksa `.env.local` dan *whitelist IP* pada konfigurasi firewall Neon.
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
  - **Prerequisites**: Drizzle Kit (`pnpm drizzle-kit`) harus bisa dijalankan lokal.
  - **Rollback / Error Handling**: Jika `generate` bertabrakan, hapus folder `drizzle/` migrasi lokal dan *re-generate* snapshot baru.
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
  - **Prerequisites**: Drizzle Kit (`pnpm drizzle-kit`) harus bisa dijalankan lokal.
  - **Rollback / Error Handling**: Jika `generate` bertabrakan, hapus folder `drizzle/` migrasi lokal dan *re-generate* snapshot baru.
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
  - **Prerequisites**: Drizzle Kit (`pnpm drizzle-kit`) harus bisa dijalankan lokal.
  - **Rollback / Error Handling**: Jika `generate` bertabrakan, hapus folder `drizzle/` migrasi lokal dan *re-generate* snapshot baru.
  - **User Instructions**: Jangan sertakan kolom `status` pada `payment_bills` untuk status lunas/sebagian. Jalankan `pnpm drizzle-kit generate` setelah langkah ini.

- Step 7: Penerapan Row Level Security (RLS) Database
  - **Task**: Menulis migrasi SQL _raw_ untuk mengaktifkan kebijakan isolasi tenant _multi-tenant_ di basis data secara langsung.
  - **Files**:
    - `src/server/db/migrations/0000_rls_setup.sql`: Buat perintah `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` untuk semua tabel operasional, beserta _POLICY_ isolasinya yang memeriksa `current_setting('app.current_school')`.
  - **Step Dependencies**: Step 6
  - **Prerequisites**: Akses Superuser/Admin via Psql atau UI Neon Console.
  - **Rollback / Error Handling**: Gunakan perintah SQL `ALTER TABLE [table] DISABLE ROW LEVEL SECURITY;` jika aplikasi terkunci total tanpa akses.
  - **User Instructions**: Lakukan _push_ migrasi SQL ini secara manual. ORM sering tidak mengeksekusi migrasi mentah (RLS) tanpa bantuan eksekutor spesifik jika menggunakan _branch_ Neon.

## [Section 3] Middleware Keamanan, Autentikasi & API Dasar

Mengganti sistem masuk (login) _mock_ dari sisi klien dengan perlindungan nyata dari layanan autentikasi Clerk dan menghubungkannya dengan API router lokal (oRPC).

- Step 8: Integrasi Clerk Authentication & Route Guards
  - **Task**: Instalasi SDK `@clerk/tanstack-start`, membuang `mock-access-token`, dan menyelimuti lapisan luar _routing_ UI dengan layanan sesi asli dari Clerk.
  - **Installation**: `pnpm add @clerk/tanstack-start`
  - **Files**:
    - `src/routes/__root.tsx` (atau `src/app/router.tsx`): Bungkus _provider_ utama dengan `<ClerkProvider>`.
    - `src/features/auth/components/sign-in-form.tsx`: Ganti form UI manual dengan pemanggilan ke komponen `<SignIn>` dari Clerk.
    - `src/stores/auth-store.ts`: Hapus isi tiruan _(mock)_ sepenuhnya; ganti dengan utilitas sederhana pembungkus hook Clerk (`useUser`, `useAuth`) untuk membaca `publicMetadata`.
    - `src/routes/_authenticated.tsx`: Minta router untuk mengalihkan rute ke halaman `/sign-in` jika pengguna belum memiliki _session_ yang valid.
  - **Step Dependencies**: Step 2
  - **Prerequisites**: 
    - Akun dev Clerk terkonfigurasi untuk TanStack Start.
    - Pastikan `drizzle.config.ts` sudah dimodifikasi untuk membaca `.env.local` agar migrasi mengarah ke Neon Dev Branch.
  - **Rollback / Error Handling**: Matikan sementara *Route Guard* di `_authenticated.tsx` jika terjadi *infinite redirect loop*.
  - **User Instructions**: Konfigurasikan halaman pemilih _tenant/unit_ sebagai destinasi setelah login jika pengguna memiliki _multi-unit_.

- Step 9: Middleware Server untuk Konteks Autentikasi & RLS
  - **Task**: Membuat lapisan perlindungan (middleware oRPC) yang mencegat permintaan _(request)_ API, memverifikasi token JWT via SDK _backend_ Clerk, dan menyuntikkan ID pengguna ke sesi _database_ PostgreSQL.
  - **Files**:
    - `src/server/middleware/auth.ts`: Middleware pemverifikasi _Clerk JWT_.
    - `src/server/middleware/rls.ts`: Fungsi yang memanggil perintah `db.execute(sql... set_config(...))` sebelum kueri dilakukan untuk menjamin filter RLS berjalan.
    - `src/server/middleware/rbac.ts`: Fungsi _guard_ peran (contoh: `requireRole(['bendahara', 'super_admin'])`).
  - **Step Dependencies**: Step 7, Step 8
  - **Prerequisites**: Pastikan RLS sudah aktif di level Postgres (Step 7).
  - **Rollback / Error Handling**: Hapus blok `set_config` dari oRPC router jika menembakkan error non-stop saat testing kueri.
  - **User Instructions**: Jika permintaan gagal memverifikasi JWT, segera lemparkan _ORPCError_ (misal: `UNAUTHORIZED`).

- Step 10: Middleware Pencatatan Log Aktivitas Terpusat
  - **Task**: Implementasi ADR-05. Membuat sistem pencatatan otomatis (_intercepting middleware_) yang menangkap hasil berhasilnya sebuah mutasi, lalu menyisipkannya ke `activity_logs`.
  - **Files**:
    - `src/server/middleware/activity-log.ts`: Definisikan `ActivityLogConfig` dan bangun fungsi `withActivityLog` yang mengambil _input_, _result_, dan konteks _user_.
  - **Step Dependencies**: Step 6, Step 9
  - **Prerequisites**: Pastikan RLS sudah aktif di level Postgres (Step 7).
  - **Rollback / Error Handling**: Hapus blok `set_config` dari oRPC router jika menembakkan error non-stop saat testing kueri.
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
  - **Prerequisites**: Port default Vite dan oRPC client (5173 / localhost) dikonfigurasi sama.
  - **Rollback / Error Handling**: Cek log `server.ts` atau *Network Tab*. Revert file index router jika *cors error* muncul.
  - **User Instructions**: Pastikan _frontend_ menggunakan skema `fetch` standar via orpc-client untuk mengirim header `Authorization: Bearer <token_clerk>`.

- Step 12: Konfigurasi Background Job `pg-boss` (Colocated)
  - **Task**: Menerapkan Keputusan C3 dengan menghidupkan _job queue_ PostgreSQL pada proses memori server yang sama untuk pemrosesan asinkron ringan di Phase 1.
  - **Files**:
    - `src/server/jobs/index.ts`: Definisikan _bootstrap_ instansiasi `PgBoss` dengan `schema: "pgboss"`. Buat fungsi ekspor `startJobWorkers()`.
    - `server.ts`: Integrasikan pemanggilan asinkron `await pgBoss.start()` bersamaan dengan jalannya server HTTP.
  - **Step Dependencies**: Step 11
  - **Prerequisites**: Port default Vite dan oRPC client (5173 / localhost) dikonfigurasi sama.
  - **Rollback / Error Handling**: Cek log `server.ts` atau *Network Tab*. Revert file index router jika *cors error* muncul.
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
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Ini sangat krusial. Pastikan token dikembalikan (di-_refresh_) saat pengguna mengubah unit, karena data sesi `activeUnitId` pada token digunakan di level database.

- Step 14: Restrukturisasi API Dashboard Real-Time
  - **Task**: Menggantikan simulasi jeda `sleep()` dan kumpulan array fiktif dengan kueri agregasi komprehensif pada database langsung.
  - **Files**:
    - `src/server/routers/dashboard.ts`: Buat prosedur untuk mendapatkan jumlah siswa/guru aktif, penarikan _activity_logs_, dan kalkulasi total uang untuk grafik arus kas.
    - `src/server/routers/index.ts`: Tambahkan `dashboardRouter`.
    - `src/features/dashboard/hooks/use-dashboard-data.ts`: Gantikan permintaan tiruan dengan fungsi kait `useQuery` dari router oRPC.
    - `src/features/dashboard/components/activity-feed.tsx`: Pasang _binding_ variabel baru secara langsung.
  - **Step Dependencies**: Step 11, Step 13
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Untuk grafik _cashflow_, komputasikan hasil pada sisi server terlebih dulu sehingga klien hanya merender grafik final. Waspada terhadap masalah serialisasi format tanggal (`date` vs `string`) saat JSON dikirim melalui oRPC dari PostgreSQL.

## [Section 6] Migrasi Domain: Akademik Inti (Tahun Ajaran & Kelas)

- Step 15: Konversi Tahun Pelajaran & Logika Aktivasi
  - **Task**: Membuat _endpoints_ untuk tahun pelajaran. Menulis transaksi eksklusif `activate` yang mencabut status aktif pada entitas lain dan menetapkannya di satu rekor.
  - **Files**:
    - `src/server/routers/academic-years.ts`: Prosedur CRUD & `activate` (menggunakan blok `db.transaction`).
    - `src/server/routers/index.ts`: Tambahkan `academicYearsRouter`.
    - `src/features/academic-years/hooks/use-academic-years.ts` (atau padanan komponen): Ubah penggunaan status _mock_ ke mutasi oRPC.
  - **Step Dependencies**: Step 11
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Transaksi wajib digunakan di fungsi `activate` agar pangkalan data tidak memiliki jeda sesaat yang diisi dua _active year_ bersamaan.

- Step 16: Migrasi Kelas & Prosedur Kenaikan Massal
  - **Task**: Memindahkan logika manajemen Kelas, dan yang paling kritikal, fitur **Kenaikan Kelas Massal**. Mutasi harus menavigasikan pembaruan banyak pendaftaran (enrollments) dengan _transaction block_.
  - **Files**:
    - `src/server/routers/classes.ts`: CRUD Kelas dan _endpoint_ aksi besar `promoteMassal`.
    - `src/server/routers/index.ts`: Tambahkan `classesRouter`.
    - `src/features/classes/components/promote-class-dialog.tsx`: Sambungkan UI _checkbox_ massal dengan input oRPC yang mengambil daftar _array_ ID Siswa.
  - **Step Dependencies**: Step 15
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Pastikan penggunaan `withActivityLog` dicantumkan di prosedur `promoteMassal` untuk mencatat jumlah siswa yang dipindahkan. **Sangat Penting:** Saat melakukan transaksi massal dengan Drizzle, pastikan memanggil kueri dengan objek *transaction* (`tx`), BUKAN objek `db` utama di dalam blok callback `db.transaction(async (tx) => {...})`.

## [Section 7] Migrasi Domain: Sumber Daya Manusia (Guru)

- Step 17: Operasional Utama CRUD Guru
  - **Task**: Menyelesaikan logika formulir tambah/sunting, status penonaktifan secara halus _(soft-delete)_, dan paginasi daftar pencarian berbasis penyaringan _server-side_.
  - **Files**:
    - `src/server/routers/teachers.ts`: Prosedur list, mutasi `create`, `update`, `deactivate`.
    - `src/server/routers/index.ts`: Tambahkan `teachersRouter`.
    - `src/features/teachers/hooks/use-teachers.ts`: Refaktorisasi ke mutasi `oRPC`.
    - `src/features/teachers/components/teacher-form-drawer.tsx`: Pasang _form hook_ dan _Zod resolver_ secara langsung ke mutasi.
  - **Step Dependencies**: Step 11
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Ingat ADR-06; Jangan buat tabel tambahan untuk mata pelajaran. Simpan dan kirim ke _endpoint_ secara natural menggunakan struktur array string (JSON).

- Step 18: Pengunggahan Borongan (_Bulk Import_) Eksekusi Guru
  - **Task**: Membuat fungsionalitas impor besar (Excel) di latar belakang (Phase 1 pg-boss colocation).
  - **Files**:
    - `src/server/jobs/bulk-import-teachers.ts`: Pekerja `pg-boss` spesifik untuk melakukan interogasi _SheetJS_, menyaring per-baris, dan _insert_ baris sukses.
    - `src/server/routers/teachers.ts`: Sisipkan prosedur `importExecute` yang menempatkan data mentah array dari baris _valid_ ke dalam antrean (job).
    - `src/features/teachers/components/teacher-import-dialog.tsx`: Modifikasi status muatan menjadi pemicu siklus _polling_ kueri ke status pg-boss.
  - **Step Dependencies**: Step 12, Step 17
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
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
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Pendaftaran ini sangat sensitif terhadap Tahun Pelajaran Aktif. Panggil variabel kontekstual tahun ajaran pada server secara langsung. Karena ini melibatkan INSERT ke dua tabel berbeda (`students` dan `enrollments`), pastikan operasi dibungkus dengan `db.transaction` dan memanggil kueri via argumen `tx`.

- Step 20: Alih Status, Kelulusan, & Mutasi Siswa
  - **Task**: Implementasi perubahan status (ADR Aturan C6). Mengganti ID Kelas atau mengubah status keluar yang diwajibkan menulis di tabel histori.
  - **Files**:
    - `src/server/routers/students.ts`: Sisipkan prosedur `changeStatus` yang membutuhkan `metadata` tambahan (sekolah tujuan, dsb.).
    - `src/features/students/components/student-profile/index.tsx`: Tarik data dari server nyata untuk Tab profil dan rekaman riwayat.
    - `src/features/students/components/status-change-dialogs/transfer-dialog.tsx`: Ganti panggilan buatan dengan fungsi oRPC.
    - `src/features/students/components/status-change-dialogs/graduate-dialog.tsx`: (Sama dengan di atas).
  - **Step Dependencies**: Step 19
  - **Prerequisites**: Jalankan *database seed* sederhana atau pastikan DB bisa ditulis.
  - **Rollback / Error Handling**: Jika mutasi gagal atau form macet di UI, periksa *Validation Error (Zod)* dari oRPC dan batalkan transaksi jika ada data anomali.
  - **User Instructions**: Pastikan Mutasi dan Kelulusan memicu `withActivityLog` untuk _compliance_ keamanan. Siswa terkeluarkan tidak dihapus datanya dari UI, tetapi ditandai secara visual.

## [Section 9] Migrasi Domain: SPP & Keuangan Kritis

Ini adalah sesi paling kompleks karena ketatnya _constraint_ kepresisian matematika. **(Perhatian: ADR-07 - Wajib Penggunaan decimal.js).**

- Step 21: Tooling Keuangan & Restrukturisasi Formatter
  - **Task**: Mengimplementasikan basis alat `decimal.js` secara mendalam. Menyingkirkan tipe data `Number` standar di bagian _service_ pengkalkulasi tagihan.
  - **Files**:
    - `src/lib/validators/finance.ts`: Buat skema _Zod_ validasi khusus yang menyerap `number/string` dari UI dan mengekspor nilainya sebagai string format _decimal-safe_.
    - `src/lib/formatters.ts`: Modifikasi `formatRupiah` agar menerima ekstensi `Decimal`.
  - **Step Dependencies**: Step 2
  - **Prerequisites**: Pahami aturan kepresisian ADR-07. Wajib siapkan `decimal.js`.
  - **Rollback / Error Handling**: Jika kalkulasi nominal tidak imbang, telusuri variabel nilai asli Postgres, pastikan tidak ter-*casting* menjadi tipe *float*.
  - **User Instructions**: Jika AI menemukan kalkulasi seperti `amount - discount` menggunakan metode dasar JS dalam mutasi, blokir keras dan gunakan fitur fungsional `.minus()`, `.times()`.

- Step 22: Pengaturan Tagihan & Penguncian Diskon SPP
  - **Task**: Migrasi penyesuaian tarif SPP dan skema subsidi per siswa. Skema subsidi otomatis mengunci _is_locked_ di pertengahan tahun berjalan.
  - **Files**:
    - `src/server/routers/spp.ts`: Prosedur `createCategory`, `setRates`, dan `setDiscountScheme`.
    - `src/server/jobs/generate-bills.ts`: Buat pekerja (job) `pg-boss` untuk menyebarkan dokumen `payment_bills` berkala di awal waktu.
    - `src/features/spp/components/config/class-rates-matrix.tsx`: Menarik tabel referensi harga aktual dari mutasi oRPC.
    - `src/features/spp/components/config/discount-schemes-table.tsx`: Aktifkan ikon 'Terkunci 🔒' pada antarmuka bagi subsidi yang tak bisa diakses.
  - **Step Dependencies**: Step 21
  - **Prerequisites**: Pahami aturan kepresisian ADR-07. Wajib siapkan `decimal.js`.
  - **Rollback / Error Handling**: Jika kalkulasi nominal tidak imbang, telusuri variabel nilai asli Postgres, pastikan tidak ter-*casting* menjadi tipe *float*.
  - **User Instructions**: Cek panjang kolom teks `billing_month` secara paksa (contoh regex Zod `"YYYY-MM"`) di validasi input SPP.

- Step 23: Pencatatan Pembayaran & Reversal (Inti Operasional)
  - **Task**: Pengimplementasian prosedur catatan bayar _append-only_ (ADR-04) yang secara otomatis akan menangkap kelebihan pembayaran (`overpayment`) di transaksi kedua.
  - **Files**:
    - `src/server/routers/spp.ts`: Endpoint `recordPayment` dan endpoint `reversePayment` yang saling berelasi pada ID transaksi (`reversedById`).
    - `src/features/spp/components/record-payment-dialog.tsx`: Modifikasi fungsi masukan di dialog agar langsung menjalankan oRPC dan menangkap jumlah _overpayment_.
    - `src/features/spp/components/reversal-dialog.tsx`: Bind langsung mutasi reversal, mewajibkan kolom alasan di UI.
    - `src/features/spp/components/transactions-table.tsx`: Tarik data kueri nyata dan beri corat (strikethrough) gaya visual bagi mutasi ter-_reverse_.
  - **Step Dependencies**: Step 22
  - **Prerequisites**: Pahami aturan kepresisian ADR-07. Wajib siapkan `decimal.js`.
  - **Rollback / Error Handling**: Jika kalkulasi nominal tidak imbang, telusuri variabel nilai asli Postgres, pastikan tidak ter-*casting* menjadi tipe *float*.
  - **User Instructions**: Jangan buat kolom status pembatalan, selalu sisipkan transaksi rekor baru ke `payment_transactions` yang dikurasi oleh middleware catat kegiatan (_Activity Log_). Gunakan objek `tx` dengan hati-hati untuk memastikan integritas atomik saat menyimpan rekam *reversal* dan pencatatan *log*.

- Step 24: Migrasi Matriks Tunggakan Secara Dinamis
  - **Task**: Menghilangkan komputasi lunas/sebagian yang dimuat ke status klien. Sepenuhnya menyalin _Raw SQL Query_ (ADR-03) ke peladen backend Drizzle.
  - **Files**:
    - `src/server/routers/spp.ts`: Buat endpoint `getPaymentMatrix` dan `getArrears` yang hanya menyiarkan blok status string siap-pakai dan ringkasan defisit.
    - `src/features/spp/components/payment-matrix.tsx`: Sapu hapus _useMemo_ kompleks; panggil dan tampilkan matriks hasil olahan data server begitu saja.
    - `src/features/spp/components/arrears-table.tsx`: Kaitkan data asli ke tabel UI sisa tagihan.
  - **Step Dependencies**: Step 23
  - **Prerequisites**: Pahami aturan kepresisian ADR-07. Wajib siapkan `decimal.js`.
  - **Rollback / Error Handling**: Jika kalkulasi nominal tidak imbang, telusuri variabel nilai asli Postgres, pastikan tidak ter-*casting* menjadi tipe *float*.
  - **User Instructions**: Gunakan metode eksekusi parameter SQL bawaan di Drizzle untuk mendedah `CASE WHEN... THEN 'paid' ELSE 'partial'` persis seperti di ADR-03.

- Step 25: Integrasi Cashflow & _Auto-Link_ Pembayaran
  - **Task**: Menyusun prosedur laporan arus kas. Memastikan setiap transaksi `recordPayment` pada SPP secara atomik mengunggah duplikat _read-only_ ke catatan `cashflow_transactions` pada _transaction block_ yang sama.
  - **Files**:
    - `src/server/routers/cashflow.ts`: Prosedur CRUD kategori dan entri riwayat _cashflow_.
    - `src/server/routers/spp.ts` (Update): Buka _transaction block_ `recordPayment` lalu sisipkan pemanggilan _insert_ ke `cashflow_transactions` bersamaan dengan simpan SPP.
    - `src/features/cashflow/components/transactions-table.tsx`: Modifikasi aksi baris; hilangkan menu ubah/hapus dari tombol _dropdown_ bila entri itu memiliki kolom `sppPaymentId` (auto-linked).
    - `src/features/cashflow/hooks/use-cashflow.ts`: Transformasi kode lama ke kueri nyata oRPC.
  - **Step Dependencies**: Step 24
  - **Prerequisites**: Pahami aturan kepresisian ADR-07. Wajib siapkan `decimal.js`.
  - **Rollback / Error Handling**: Jika kalkulasi nominal tidak imbang, telusuri variabel nilai asli Postgres, pastikan tidak ter-*casting* menjadi tipe *float*.
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
  - **Prerequisites**: Modul pengekspor (misalnya pdflib atau exceljs) sudah ditambahkan di package.json.
  - **Rollback / Error Handling**: Jika antrean pg-boss *stuck*/macet, ubah fungsi menjadi sinkron memblokir (mengembalikan stream murni) sebagai langkah fallback (darurat).
  - **User Instructions**: Pastikan tabel events merender nilai aslinya, status kegiatan lawas tidak berubah ke 'selesai' dengan otomatis via rutinitas tanpa instruksi langsung (Aturan B13).

- Step 27: Infrastruktur Pengekspor Laporan (pg-boss Generator)
  - **Task**: Mengeksekusi penarikan data borongan yang diolah menjadi berkas Excel/PDF dari latar belakang melalui penugasan _(Job workers)_ untuk efisiensi RAM antarmuka.
  - **Files**:
    - `src/server/jobs/generate-excel-report.ts`: Tulis modul pengisi baris _ExcelJS_ berdasarkan variabel tipe laporan (SPP/Cashflow).
    - `src/server/routers/reports.ts`: Bangun endpoint _RPC_ guna memicu _Job_, serta endpoint cek status/unduh untuk mengambil data hasil olahan (Blob/Base64).
    - `src/features/shared/components/export-button.tsx` (atau setara): Perbarui komponen UI tombol Ekspor menjadi alur yang memberikan notifikasi _toast_ selama mesin bekerja dan memanggil pengunduhan kala selesai.
  - **Step Dependencies**: Step 12, Step 24, Step 25
  - **Prerequisites**: Modul pengekspor (misalnya pdflib atau exceljs) sudah ditambahkan di package.json.
  - **Rollback / Error Handling**: Jika antrean pg-boss *stuck*/macet, ubah fungsi menjadi sinkron memblokir (mengembalikan stream murni) sebagai langkah fallback (darurat).
  - **User Instructions**: Jika utilitas pengiriman tautan file unduhan sulit diimplementasikan di Phase 1 tanpa kompartemen _Storage Cloud_ (S3), Anda dapat mengirimkan respons _buffer base64_ ringan langsung dari pg-boss ke klien bila memori menyanggupi. Memastikan aliran pengguna tidak membeku.
