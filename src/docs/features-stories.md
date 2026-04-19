# EDARA — Features List *(v3 — Updated)*

---

## Features List

### 1. Multi-Tenant & Struktur Organisasi

#### 1.1 Registrasi & Konfigurasi Yayasan

- [ ] **User Stories**
  - [ ] Sebagai Admin Yayasan, saya ingin mendaftarkan profil yayasan dengan data legalitas lengkap, sehingga seluruh unit di bawahnya memiliki identitas institusional yang sah dan terpusat.
  - [ ] Sebagai Admin Yayasan, saya ingin mengunggah logo yayasan, sehingga tampilan platform mencerminkan identitas visual institusi kami.
  - [ ] Sebagai Admin Yayasan, saya ingin mengedit informasi yayasan kapan saja, sehingga data selalu akurat jika ada perubahan alamat atau nomor legalitas.

##### UX/UI Considerations

**Perjalanan Pengguna:** Onboarding pertama → Admin isi form profil yayasan → Upload logo → Simpan → Diarahkan ke halaman pembuatan unit pertama dengan empty state.

- [ ] **Core Experience**
  - [ ] *Initial State*: Form dua kolom — kiri berisi identitas (nama yayasan\*, NPYP/nomor legalitas\*), kanan berisi kontak & lokasi (alamat, kota). Upload area logo di atas form, full-width — drag-and-drop zone dengan ilustrasi kecil dan label "Klik atau seret logo yayasan ke sini (PNG/JPG/SVG, maks. 2MB)"
  - [ ] *Filled State*: Preview logo real-time menggantikan upload zone begitu file dipilih. Field NPYP menampilkan format mask otomatis. Tombol "Simpan" aktif hanya jika semua field wajib terisi
  - [ ] *Save State*: Tombol berubah menjadi spinner + "Menyimpan..." saat proses berlangsung. Toast success hijau muncul di pojok kanan bawah selama 3 detik: "Profil yayasan berhasil disimpan." Setelahnya, CTA "Buat Unit Pertama →" muncul di bawah toast
  - [ ] *Edit Mode*: Halaman Pengaturan Yayasan menampilkan data dalam mode baca. Tombol "Edit Profil" mengaktifkan semua field sekaligus — mencegah perubahan tidak disengaja. Perubahan nama yayasan memunculkan confirmation dialog yang menjelaskan dampaknya secara singkat

- [ ] **Advanced Users & Edge Cases**
  - [ ] Jika logo melebihi 2MB atau format tidak didukung: error inline di bawah upload zone — bukan alert browser
  - [ ] Jika Admin menutup browser di tengah pengisian: form menyimpan draft di localStorage; saat kembali muncul banner "Anda memiliki isian yang belum disimpan — lanjutkan?"
  - [ ] Jika NPYP sudah terdaftar di tenant lain dalam sistem: warning advisory — tidak memblokir penyimpanan

---

#### 1.2 Manajemen Unit Pendidikan

- [ ] **User Stories**
  - [ ] Sebagai Admin Yayasan, saya ingin membuat unit pendidikan baru dengan data lengkap termasuk jenjang dan NPSN, sehingga setiap sekolah/madrasah memiliki ruang data yang terisolasi.
  - [ ] Sebagai Admin Yayasan, saya ingin melihat semua unit dalam satu halaman dengan status ringkas, sehingga saya dapat memantau kondisi seluruh unit sekilas pandang.
  - [ ] Sebagai Admin Yayasan, saya ingin mengedit informasi unit yang sudah ada, sehingga data NPSN atau kontak yang berubah dapat diperbarui tanpa kehilangan riwayat.
  - [ ] Sebagai pengguna unit, saya ingin dipastikan tidak dapat melihat atau mengakses data unit lain, sehingga kerahasiaan operasional tiap sekolah terjaga.

##### UX/UI Considerations

**Perjalanan Pengguna:** Dashboard Yayasan → "Kelola Unit" → Grid unit → "+ Tambah Unit" → Side drawer → Simpan → Unit baru muncul di grid.

- [ ] **Core Experience**
  - [ ] *Unit Overview Page*: Grid 3 kolom (desktop), 2 kolom (tablet), 1 kolom (mobile). Setiap kartu: avatar/logo unit, nama unit, jenjang (badge berwarna: MI/MTs/MA = hijau tua; SD/SMP/SMA/SMK = biru), NPSN, jumlah siswa aktif, badge status Aktif/Nonaktif. Hover state: elevasi ringan dengan shadow transition 150ms ease-out. Klik kartu → masuk ke konteks unit tersebut
  - [ ] *Empty State*: Ilustrasi bangunan sekolah, teks "Belum ada unit terdaftar", CTA button "Tambah Unit Pertama" — sesuai prinsip dashboard shell: struktur halaman tetap utuh, area konten diisi ilustrasi + dua tombol CTA "Kembali" dan "Ke Beranda"
  - [ ] *Add/Edit Unit Side Drawer*: Lebar 480px dari kanan, backdrop semi-transparan. Section "Identitas Unit": Nama Unit\*, Jenjang\* (dropdown dengan optgroup: Madrasah → MI/MTs/MA; Umum → SD/SMP/SMA/SMK), NPSN (8 digit). Section "Lokasi & Kontak": Alamat, Kota, Nomor HP, Email Unit. Tombol Batal + Simpan sticky di footer drawer
  - [ ] *Aksi Per Kartu*: Ikon tiga titik (`···`) di pojok kanan atas kartu → popover: "Edit Unit", "Nonaktifkan". Popover menutup otomatis saat klik di luar

- [ ] **Advanced Users & Edge Cases**
  - [ ] NPSN divalidasi format 8 digit real-time. Jika sudah dipakai unit lain dalam yayasan yang sama: warning non-blocking
  - [ ] Menonaktifkan unit: modal konfirmasi eksplisit menampilkan jumlah siswa aktif + pengguna terdampak. Tombol konfirmasi merah "Ya, Nonaktifkan Unit"
  - [ ] Unit nonaktif tetap muncul di grid dengan overlay abu-abu dan badge "Nonaktif" — tidak disembunyikan

---

#### 1.3 Unit Switcher & Pemilihan Konteks

- [ ] **User Stories**
  - [ ] Sebagai Super Admin, saya ingin berpindah ke konteks unit tertentu melalui unit switcher di topbar, sehingga saya dapat melihat dan mengelola data unit tersebut tanpa logout.
  - [ ] Sebagai pengguna multi-unit (Admin/Bendahara), saya ingin memilih unit aktif setelah login, sehingga semua aksi saya diterapkan pada unit yang tepat.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Unit Switcher di Topbar*: Menampilkan nama unit aktif + chevron-down. Klik → dropdown daftar unit dapat discroll. Setiap item: nama unit + jenjang badge. Item aktif: checkmark + background accent. Animasi: fade + slide-down 200ms cubic-bezier. Pada mobile: unit switcher tetap tersedia di topbar, namun dropdown menjadi bottom sheet yang muncul dari bawah layar
  - [ ] *Context Change Feedback*: Saat unit diganti, topbar menampilkan skeleton shimmer singkat pada nama unit (~400ms) sebelum konten halaman refresh
  - [ ] *Multi-Unit Login Selector*: Halaman intermediate "Pilih Unit Kerja" — bukan modal. Layout kartu unit besar dan jelas. Pengguna wajib memilih sebelum masuk dashboard
  - [ ] *Konteks Banner*: Super Admin di konteks unit tertentu melihat banner subtle di bawah topbar: "Anda sedang melihat data [Nama Unit] — [Kembali ke Yayasan]"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Unit Switcher tidak tersedia untuk pengguna dengan satu unit — digantikan teks statis nama unit di posisi yang sama agar layout konsisten
  - [ ] Pada mobile, dropdown unit switcher berubah menjadi **bottom sheet** dengan handle bar di atas — mengikuti konvensi mobile untuk interaksi yang lebih natural

---

### 2. Autentikasi & RBAC

#### 2.1 Login & Session Management

- [ ] **User Stories**
  - [ ] Sebagai pengguna, saya ingin login dengan email dan password, sehingga saya dapat mengakses fitur sesuai role saya dengan aman.
  - [ ] Sebagai pengguna, saya ingin sistem mengarahkan saya ke dashboard yang relevan secara otomatis, sehingga saya tidak perlu navigasi manual.
  - [ ] Sebagai pengguna, saya ingin session saya berakhir otomatis setelah periode tidak aktif, sehingga keamanan data terjaga.

##### UX/UI Considerations

**Perjalanan Pengguna:** Buka URL → Halaman Login → Input email + password → Klik "Masuk" → Cek role & unit → (a) Satu unit: langsung dashboard; (b) Multi-unit: halaman pilih unit → Dashboard.

- [ ] **Core Experience**
  - [ ] *Login Page Desktop*: Layout split — kiri 40% branding EDARA (logo, tagline "Sistem administrasi madrasah yang tidak perlu pelatihan IT", ilustrasi ringan bertema madrasah dengan palet hijau tua `#1B4332` dan aksen amber), kanan 60% form login pada background putih
  - [ ] *Login Page Mobile*: Branding disembunyikan sepenuhnya. Form login full screen dengan logo EDARA kecil di tengah atas form. Padding horizontal 24px. Tombol "Masuk" full-width
  - [ ] *Form*: Email field (ikon amplop kiri), password field (ikon toggle show/hide kanan — eye icon). Tombol "Masuk" full-width, warna `#1B4332`. Loading: spinner inline + "Memverifikasi..."
  - [ ] *Error State*: Banner merah di atas form, animasi shake horizontal 300ms — tidak menghapus email. Pesan: "Email atau password salah. Silakan coba lagi."
  - [ ] *Post-Login*: Transisi fade-in ke dashboard

- [ ] **Advanced Users & Edge Cases**
  - [ ] Setelah 5 kali gagal: tombol "Masuk" di-disable + countdown "Coba lagi dalam 4:59"
  - [ ] Sesi berakhir 8 jam inaktivitas: modal "Sesi Anda telah berakhir" saat pengguna kembali aktif; email pre-filled di form login
  - [ ] "Lupa Password?" di bawah form → v1: modal statis "Hubungi administrator yayasan untuk reset password Anda."

---

#### 2.2 Manajemen Pengguna & RBAC

- [ ] **User Stories**
  - [ ] Sebagai Super Admin, saya ingin membuat akun pengguna baru dengan role dan unit yang ditetapkan, sehingga hak akses terdistribusi dengan tepat.
  - [ ] Sebagai Super Admin, saya ingin menonaktifkan akun yang sudah tidak aktif, sehingga akses sistem tetap terkontrol.
  - [ ] Sebagai pengguna dengan role terbatas, saya ingin mendapat pesan informatif jika mengakses halaman di luar wewenang saya, sehingga saya memahami batas akses tanpa bingung.

##### UX/UI Considerations

**Perjalanan Pengguna:** Super Admin → "Manajemen Pengguna" → Tabel pengguna → "+ Tambah Pengguna" → Side drawer → Simpan.

- [ ] **Core Experience**
  - [ ] *User Table*: Kolom — Nama, Email, Role (badge berwarna), Unit (chip, bisa lebih dari satu), Status, Aksi (ikon `···` → popover: Edit, Nonaktifkan). Role badge colors konsisten di seluruh aplikasi: Super Admin = ungu; Kepala Sekolah = biru; Admin/TU = hijau teal; Bendahara = oranye
  - [ ] *Add User Side Drawer*: Field nama\*, email\*, dropdown role\*. Setelah role dipilih, field "Unit" muncul secara progressive disclosure — multi-select untuk Admin/Bendahara, single-select untuk Kepala Sekolah. Super Admin tidak perlu field unit
  - [ ] *Unauthorized Page*: Dashboard shell tetap utuh (sidebar, topbar). Area konten: ilustrasi kunci/gembok (warna brand), teks "Anda tidak memiliki akses ke halaman ini", penjelasan role yang dibutuhkan, dua tombol CTA: "Kembali" dan "Ke Beranda"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Super Admin tidak dapat mengubah role/menonaktifkan akun dirinya sendiri — action di-disable + tooltip "Tidak dapat mengubah akun aktif Anda"
  - [ ] Perubahan role berlaku pada sesi berikutnya — session aktif tidak langsung terpotong

---

### 3. Manajemen Tahun Pelajaran

#### 3.1 Siklus Tahun Pelajaran

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin membuat tahun pelajaran baru dengan nama dan rentang tanggal, sehingga semua data akademik dan keuangan terikat pada periode yang benar.
  - [ ] Sebagai Admin, saya ingin mengaktifkan tahun pelajaran baru dan sistem otomatis menonaktifkan tahun sebelumnya, sehingga tidak ada dua tahun pelajaran aktif bersamaan.
  - [ ] Sebagai Kepala Sekolah, saya ingin melihat riwayat semua tahun pelajaran beserta ringkasan datanya, sehingga saya dapat membandingkan kondisi antar periode.

##### UX/UI Considerations

**Perjalanan Pengguna:** Pengaturan → Tahun Pelajaran → Timeline list → "Tambah Tahun Pelajaran" → Modal → Simpan → Muncul di list → Tombol "Aktifkan" → Konfirmasi.

- [ ] **Core Experience**
  - [ ] *Daftar Tahun Pelajaran*: Layout timeline vertikal, terbaru di atas. Setiap item: nama, rentang tanggal, badge status (Aktif = hijau dengan ring highlight; Tidak Aktif = abu-abu; Mendatang = biru). Item aktif: border kiri tebal warna `#1B4332` + label "Aktif Saat Ini". Aksi per item: ikon `···` → popover (Aktifkan / Lihat Ringkasan / Hapus)
  - [ ] *Tambah Form (Modal)*: Nama\* (auto-suggest berdasarkan tahun aktif + 1, contoh: "2025/2026"), date picker tanggal mulai\* dan selesai\*. Helper text: "Durasi: ~12 bulan" dihitung real-time. Catatan opsional
  - [ ] *Aktivasi Flow*: Klik "Aktifkan" → confirmation dialog menyebut secara eksplisit tahun yang akan dinonaktifkan dan diaktifkan. Post-aktivasi: toast success + CTA inline "Atur Kelas Sekarang →"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Rentang tanggal tumpang tindih terdeteksi saat field tanggal selesai di-blur — validasi sebelum submit
  - [ ] Penghapusan tahun pelajaran berdata: diblokir dengan pesan spesifik "Tahun Pelajaran ini memiliki X kelas dan Y tagihan. Gunakan nonaktifkan sebagai gantinya."
  - [ ] Tahun pelajaran nonaktif yang sudah memiliki data historis hanya menampilkan "Lihat Ringkasan" — tombol edit disembunyikan untuk menjaga integritas data

---

### 4. Dashboard Analitik

#### 4.1 Dashboard Unified (Semua Role)

Semua role melihat **satu dashboard yang sama** per unit aktif. Yang berbeda antar role adalah hak akses ke modul di sidebar — bukan konten dashboard. Super Admin di konteks unit tertentu melihat dashboard unit itu, identik dengan yang dilihat Admin atau Kepala Sekolah unit tersebut.

- [ ] **User Stories**
  - [ ] Sebagai pengguna (semua role), saya ingin melihat kondisi unit secara sekilas begitu login, sehingga saya langsung tahu status operasional tanpa navigasi ke modul terpisah.
  - [ ] Sebagai pengguna, saya ingin melihat tren arus kas 6 bulan terakhir dalam grafik, sehingga saya dapat mendeteksi pola keuangan yang tidak wajar.
  - [ ] Sebagai pengguna, saya ingin melihat log aktivitas terbaru di sistem, sehingga saya tahu apa yang sudah dilakukan hari ini.

##### UX/UI Considerations

**Perjalanan Pengguna:** Login → Dashboard otomatis tampil → Scroll untuk melihat seluruh widget → Navigasi ke modul via sidebar.

- [ ] **Core Experience**
  - [ ] *Layout Desktop*: Tiga baris. **Baris 1 — Summary Cards** (3 kartu horizontal): (1) Total Siswa Aktif — ikon siswa, angka besar bold, subtext "Tahun Pelajaran Aktif", delta vs bulan lalu. (2) Total Guru Aktif — ikon orang, angka, delta. (3) Pemasukan SPP Bulan Ini — ikon Rp, angka currency, delta %. Delta colors: hijau = naik, merah = turun, abu-abu = flat. Kartu memiliki hover elevation ringan meski tidak clickable. **Baris 2 — Chart & Kegiatan** (dua kolom): Kiri 60% — Chart Tren Arus Kas 6 bulan (bar grouped: hijau = pemasukan, merah = pengeluaran; garis saldo bersih). Kanan 40% — Kegiatan Mendatang (list 3–5 item: chip kategori berwarna + nama kegiatan bold + tanggal relatif "3 hari lagi"). **Baris 3 — Log Aktivitas** (full-width): Feed kronologis 10 entri terbaru. Setiap entri: avatar inisial (lingkaran berwarna sesuai role badge), nama + aksi, timestamp relatif. Entri di-group per hari jika lintas hari
  - [ ] *Layout Mobile*: Single column. Summary cards stack vertikal. Chart full-width. Kegiatan Mendatang di bawah chart. Log Aktivitas di bagian paling bawah
  - [ ] *Semua Widget Read-Only*: Tidak ada tombol aksi di dalam dashboard. Navigasi ke modul murni via sidebar
  - [ ] *Sidebar Mobile*: Tidak tampil default. Tombol hamburger di topbar kiri membuka sidebar sebagai **floating panel** dari kiri dengan overlay semi-transparan menggelapkan konten di belakangnya. Tap di luar sidebar menutupnya. Animasi slide-in dari kiri 250ms ease-out

- [ ] **Advanced Users & Edge Cases**
  - [ ] Unit baru tanpa data: summary cards menampilkan "0", chart menampilkan skeleton grid kosong (bukan area blank putih). Log Aktivitas menampilkan empty state ringan: "Belum ada aktivitas tercatat"
  - [ ] Chart hanya menampilkan bulan yang sudah terlewati sebagai bar penuh; bulan mendatang (jika ada dalam window 6 bulan) ditampilkan sebagai bar outline tipis dengan opacity 40%
  - [ ] Log Aktivitas >10 entri: hanya tampilkan 10 terbaru di dashboard. Tidak ada pagination/infinite scroll di sini — dashboard bukan log viewer

---

### 5. Manajemen Guru

#### 5.1 Daftar, Pencarian & Filter Guru

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin melihat seluruh daftar guru dalam tampilan tabel yang dapat dicari dan difilter, sehingga saya dapat menemukan informasi guru dengan cepat.
  - [ ] Sebagai Admin, saya ingin memfilter berdasarkan status kepegawaian dan mata pelajaran, sehingga saya dapat menyiapkan laporan yang ditargetkan.
  - [ ] Sebagai Admin, saya ingin mengekspor daftar guru sesuai filter aktif ke Excel atau PDF, sehingga laporan tersedia untuk kebutuhan eksternal.

##### UX/UI Considerations

**Perjalanan Pengguna:** Sidebar → "Guru" → Halaman daftar → Filter/search → Klik `···` per baris untuk aksi.

- [ ] **Core Experience**
  - [ ] *Page Header*: Judul "Daftar Guru" + badge counter total (contoh: "47 Guru"), tombol "+ Tambah Guru" (primary) di kanan, tombol "Import" dan "Ekspor" (secondary/outline) di sebelahnya
  - [ ] *Filter Bar*: Dropdown "Status Kepegawaian" (Semua / Tetap / Honorer / GTT), dropdown "Mata Pelajaran" (multi-select dengan search), toggle switch "Tampilkan Nonaktif". Filter aktif ditampilkan sebagai chip removable (×) di bawah filter bar
  - [ ] *Search Bar*: Placeholder "Cari nama atau NIK..." — debounce 300ms, langsung filter
  - [ ] *Tabel Kolom*: Avatar (32px circle), Nama (bold, pin kiri), NIK, Status Kepegawaian (badge warna), Mata Pelajaran (chip, truncate >2 menjadi "Matematika, IPA +2" dengan tooltip daftar lengkap saat hover), Tanggal Bergabung, Status, Aksi (`···`)
  - [ ] *Aksi Per Baris (`···`)*: Popover dengan pilihan "Lihat Detail", "Edit", "Nonaktifkan". Popover menutup otomatis saat klik di luar atau aksi dipilih
  - [ ] *Row States*: Default = putih; Hover = hijau tua/5%; Baris nonaktif = opacity 50%
  - [ ] *Bulk Action Bar (Floating)*: Muncul mengambang di bagian bawah layar saat ≥1 baris dicentang. Berisi: jumlah baris dipilih, tombol "Nonaktifkan" + "Ekspor", tombol "Batalkan Seleksi (×)". Animasi slide-up dari bawah 200ms. Opsi menyesuaikan konteks halaman Guru
  - [ ] *Skeleton Loader*: 5 baris shimmer saat loading

- [ ] **Advanced Users & Edge Cases**
  - [ ] Empty state dengan filter aktif: dashboard shell tetap utuh, area konten menampilkan ilustrasi + "Tidak ada guru yang cocok dengan filter ini" + dua tombol CTA "Kembali" dan "Ke Beranda". Tidak ada tombol "Hapus Filter" di empty state — aksi tersebut dilakukan melalui chip filter di atas tabel
  - [ ] Ekspor mengikuti filter aktif; confirmation dialog: "Mengekspor 12 guru (filter: Honorer). Lanjutkan?"

---

#### 5.2 Tambah & Edit Data Guru

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin menambahkan data guru baru melalui form terstruktur, sehingga semua informasi penting tercatat secara konsisten.
  - [ ] Sebagai Admin, saya ingin mengedit data guru yang sudah ada, sehingga perubahan informasi dapat segera diperbarui.

##### UX/UI Considerations

**Perjalanan Pengguna:** "+ Tambah Guru" → Side drawer → Isi form dua section → Upload foto opsional → Simpan → Drawer tutup → Toast success → Baris baru muncul tanpa full reload.

- [ ] **Core Experience**
  - [ ] *Side Drawer*: Lebar 520px (desktop); pada mobile lebar 100% dari kanan dengan handle bar (bottom sheet style). Header: judul + tombol ×. Footer sticky: "Batal" (ghost) + "Simpan" (primary). Konten scrollable
  - [ ] *Form Sections*: **Identitas** — Nama\*, NIK\*, Tempat Lahir, Tanggal Lahir (date picker), Jenis Kelamin (toggle card visual: Laki-laki / Perempuan). **Kepegawaian** — Status\* (segmented control: Tetap / Honorer / GTT), Mata Pelajaran (multi-select + search), Tanggal Bergabung\*, Nomor HP, Alamat (textarea). Upload foto di atas sections — circle crop dengan preview
  - [ ] *Validasi Inline*: Error di bawah field saat blur — merah, ikon !, pesan spesifik ("NIK harus 16 digit angka")
  - [ ] *Edit Mode*: Drawer sama, judul "Edit Data Guru — [Nama]", data pre-filled, tombol "Perbarui Data"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Duplikasi NIK: warning banner di dalam drawer setelah NIK blur — tidak memblokir submit
  - [ ] Menutup drawer dengan data terisi tapi belum disimpan: confirmation "Perubahan belum disimpan. Buang perubahan?"

---

#### 5.3 Bulk Import Guru

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin mengimpor ratusan data guru sekaligus dari Excel, sehingga onboarding tidak memakan waktu entry manual.
  - [ ] Sebagai Admin, saya ingin melihat preview dan error per baris sebelum import final, sehingga saya dapat memutuskan apakah perbaiki dulu atau tetap melanjutkan.

##### UX/UI Considerations

**Perjalanan Pengguna:** Klik "Import" → Step indicator 4 langkah → Unduh template → Upload → Preview & validasi → Konfirmasi.

- [ ] **Core Experience**
  - [ ] *Step Indicator*: Progress bar horizontal 4 step bernomor + berlabel di atas konten: "1 Unduh Template → 2 Upload File → 3 Preview → 4 Konfirmasi"
  - [ ] *Step 1*: Card besar, tombol "Unduh Template Excel" prominent, penjelasan format (kolom yang diharapkan, opsi valid status kepegawaian, format tanggal)
  - [ ] *Step 2*: Drag-and-drop zone. File dipilih → nama + ukuran + ikon checklist muncul. Parsing otomatis + spinner
  - [ ] *Step 3 — Preview Table*: Baris valid = putih. Baris error = background merah muda + ikon ⚠ kiri. Hover/klik baris error → tooltip error per kolom. Counter di atas: "248 baris valid · 7 baris memiliki error"
  - [ ] *Step 4*: Summary card "Akan mengimpor 248 guru. 7 baris dilewati." Progress bar real-time saat proses. Post-import: "248 guru berhasil, 7 dilewati." + tombol "Unduh Log Error"

---

### 6. Manajemen Kelas

#### 6.1 Kelas Per Tahun Pelajaran

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin membuat kelas yang terikat ke tahun pelajaran aktif, sehingga struktur kelas selalu mencerminkan kondisi akademik terkini.
  - [ ] Sebagai Admin, saya ingin melihat daftar siswa dalam suatu kelas, sehingga saya dapat memantau komposisi kelas.
  - [ ] Sebagai Admin, saya ingin melakukan kenaikan kelas massal untuk seluruh siswa di kelas tertentu, sehingga transisi tahun pelajaran dapat diselesaikan secara efisien.

##### UX/UI Considerations

**Perjalanan Pengguna:** Sidebar → "Kelas" → Pilih Tahun Pelajaran → Grid kelas → Klik kelas → Detail + daftar siswa → "Kenaikan Kelas Massal."

- [ ] **Core Experience**
  - [ ] *Page Header*: Dropdown Tahun Pelajaran (default: aktif) di kanan atas. Ganti tahun → grid refresh dengan fade transition
  - [ ] *Class Grid*: Dikelompokkan per tingkat dengan subheader ("Kelas 7 · 3 Kelas"). Setiap kartu: nama kelas, wali kelas (nama + avatar kecil 24px), progress bar kapasitas (32/35 — hijau <80%, kuning 80–100%, merah ≥100%). Aksi kartu via ikon `···`: "Lihat Siswa", "Edit Kelas", "Hapus Kelas"
  - [ ] *Halaman Detail Kelas*: Header kartu kelas (nama, wali kelas, kapasitas). Tombol "Kenaikan Kelas Massal" di header halaman — hanya muncul jika tahun pelajaran berikutnya tersedia. Tabel siswa di bawah
  - [ ] *Kenaikan Kelas Massal (3-Step Modal)*: Step 1: Konfirmasi siswa (tabel + checkbox, default semua centang). Step 2: Pilih kelas tujuan di tahun pelajaran berikutnya. Step 3: Summary + warning merah "Aksi ini tidak dapat dibatalkan" + tombol "Konfirmasi Kenaikan Kelas"
  - [ ] *Empty State Kelas*: Dashboard shell tetap utuh. Area konten: ilustrasi kelas kosong + "Belum ada kelas untuk tahun pelajaran ini" + dua CTA "Kembali" dan "Ke Beranda"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Kelas penuh: warning saat menambah siswa — tidak diblokir keras
  - [ ] Belum ada tahun pelajaran berikutnya saat kenaikan kelas: CTA di modal "Buat Tahun Pelajaran Baru dulu"

---

### 7. Manajemen Siswa

#### 7.1 Daftar, Pencarian & Filter Siswa

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin melihat dan mencari seluruh data siswa dengan filter kelas, tahun pelajaran, dan status enrollment, sehingga data yang dibutuhkan dapat ditemukan cepat.
  - [ ] Sebagai Admin/Kepala Sekolah, saya ingin mengekspor data siswa ke Excel atau PDF sesuai filter aktif, sehingga laporan tersedia tanpa re-entry.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Filter Bar*: Tahun Pelajaran (default: aktif), Kelas (dinamis per tahun — reset otomatis saat tahun diganti), Status Enrollment (Aktif/Mutasi/Lulus/Alumni/Semua), Search (nama atau NISN)
  - [ ] *Tabel Kolom*: Avatar, Nama (bold, pin kiri), NISN, Kelas, Nama Wali, Nomor HP Wali, Status Enrollment (badge: Aktif=hijau, Mutasi=oranye, Lulus=biru, Alumni=abu-abu), Aksi (`···`: Lihat Detail, Edit, Ubah Status)
  - [ ] *Row Click*: Klik baris → halaman detail siswa (full page — karena kompleksitas rekam jejak)
  - [ ] *Bulk Action Bar (Floating)*: Muncul mengambang di bawah layar saat ≥1 baris dicentang. Menu: "Naik Kelas", "Ekspor", "Batalkan Seleksi". Opsi menyesuaikan konteks halaman Siswa
  - [ ] *Skeleton Loader*: 8 baris shimmer saat loading
  - [ ] *Empty State*: Dashboard shell utuh. Konten: ilustrasi + "Belum ada siswa terdaftar" + CTA "Kembali" dan "Ke Beranda"

---

#### 7.2 Pendaftaran Siswa Baru

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin mendaftarkan siswa baru dan langsung mengenrollnya ke kelas dalam satu alur, sehingga pendaftaran selesai tanpa berpindah halaman.
  - [ ] Sebagai Admin, saya ingin sistem memperingatkan saya jika NISN sudah terdaftar, sehingga duplikat dapat dicegah sejak awal.

##### UX/UI Considerations

**Perjalanan Pengguna:** "+ Daftar Siswa Baru" → Side drawer → Isi identitas + data keluarga + enrollment → Simpan → Drawer berubah ke success state.

- [ ] **Core Experience**
  - [ ] *Drawer Sections*: **Identitas Permanen** (Nama\*, NISN\*, NIK, TTL, Jenis Kelamin sebagai toggle card, Foto opsional). **Data Keluarga** (Nama Wali\*, Nomor HP Wali\*, Alamat). **Penempatan Kelas** — card dengan background berbeda + label "Penempatan Kelas" menonjol: Tahun Pelajaran (default aktif), Kelas\*
  - [ ] *Post-Save Success State*: Drawer berubah ke success state — nama siswa baru, kelas, dua CTA: "Lihat Profil Siswa" dan "Daftar Siswa Lain"

- [ ] **Advanced Users & Edge Cases**
  - [ ] NISN validation on blur — jika sudah terdaftar: warning dengan nama siswa yang terdaftar
  - [ ] Jika belum ada kelas untuk tahun aktif: dropdown empty + info "Belum ada kelas tersedia" + link CTA "Buat Kelas Dulu"

---

#### 7.3 Halaman Detail & Rekam Jejak Siswa

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin melihat profil lengkap siswa termasuk seluruh riwayat kelas dan pembayaran, sehingga tidak perlu mencari data di modul berbeda.
  - [ ] Sebagai Admin, saya ingin memproses perubahan status siswa dari halaman profil, sehingga perubahan tercatat dalam rekam jejak terpusat.

##### UX/UI Considerations

**Perjalanan Pengguna:** Klik baris siswa → Halaman detail (full page) → Tabs: Riwayat Kelas / Riwayat Pembayaran / Skema Pembayaran.

- [ ] **Core Experience**
  - [ ] *Page Header*: Avatar/foto (80px), Nama (H1), NISN & NIK (subtext muted), badge status enrollment aktif, tombol: "Edit Profil" (secondary) + dropdown "Ubah Status" (Naik Kelas / Mutasi Keluar / Lulus)
  - [ ] *Tab: Riwayat Kelas*: Timeline vertikal terbaru di atas. Setiap node: lingkaran ikon, Tahun Pelajaran, Kelas, Wali Kelas, Status Akhir (Naik Kelas / Mutasi / Lulus). Node aktif di-highlight dengan accent color + pulse animation ringan
  - [ ] *Tab: Riwayat Pembayaran*: Filter tahun pelajaran. Tabel: Tanggal, Kategori, Periode, Jumlah, Metode, Status, Catatan. Transaksi reversal: background merah muda + label "Reversal" + link ke transaksi asal. Aksi per baris (untuk Bendahara): `···` → "Catat Reversal"
  - [ ] *Tab: Skema Pembayaran*: Card per kategori — Tarif Dasar → Diskon (tipe + alasan + nominal) → **Tagihan Bersih** (bold hijau). Label watermark "Berlaku TP 2024/2025"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Mutasi Keluar: side drawer dengan Sekolah Tujuan, Tanggal Mutasi, Catatan. Post-save: tab Riwayat Kelas update real-time
  - [ ] Kelulusan dengan tunggakan: warning merah "Siswa ini memiliki tunggakan Rp 450.000. Tetap tandai sebagai Lulus?" — tidak memblokir

---

#### 7.4 Bulk Import Siswa

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin mengimpor ratusan data siswa sekaligus dari Excel, sehingga onboarding tidak memakan waktu entry manual.
  - [ ] Sebagai Admin, saya ingin sistem mendeteksi NISN duplikat dan memberi saya pilihan skip atau overwrite per baris, sehingga data yang ada tidak tertimpa tanpa persetujuan saya.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Alur 4 Step identik dengan Bulk Import Guru* — Step Indicator, unduh template, upload, preview, konfirmasi
  - [ ] *Khusus Step 3 — Deteksi Duplikat NISN*: Baris duplikat mendapat highlight kuning (berbeda dari merah error). Di setiap baris duplikat: toggle pilihan "Skip" atau "Overwrite" yang dapat dipilih per baris. Counter khusus: "248 baris valid · 7 duplikat NISN · 3 baris error"
  - [ ] *Step 4*: Summary mencakup tiga angka: "X akan diimpor baru, Y akan ditimpa (overwrite), Z dilewati"

---

### 8. Manajemen Pembayaran SPP

#### 8a. Konfigurasi Tarif & Skema Pembayaran

##### 8a.1 Kategori Pembayaran & Tarif Per Kelas

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin membuat kategori pembayaran dengan nominal default dan periode, sehingga sistem dapat menghasilkan tagihan yang sesuai secara otomatis.
  - [ ] Sebagai Admin, saya ingin menetapkan nominal SPP yang berbeda per kelas, sehingga tarif kelas unggulan tidak harus sama dengan kelas reguler.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Halaman Konfigurasi SPP — Tab "Kategori"*: Tabel — Nama, Periode (badge: Bulanan/Tahunan/Sekali Bayar), Nominal Default (format Rp), Status. Toggle aktif/nonaktif langsung di tabel (switch — auto-save + toast confirmation). Aksi via `···`: Edit, Nonaktifkan
  - [ ] *Tab "Tarif per Kelas" — Matriks*: Baris = kelas, kolom = kategori aktif. Sel: input currency editable inline. Sel belum diisi menampilkan nominal default kategori dalam teks abu-abu (dapat dioverride). Header kolom: tombol "Terapkan ke semua kelas" → confirmation dialog sebelum eksekusi

- [ ] **Advanced Users & Edge Cases**
  - [ ] Mengubah tarif di tahun pelajaran aktif: warning "Perubahan hanya berlaku untuk tagihan yang belum digenerate."

---

##### 8a.2 Skema Diskon & Subsidi Per Siswa

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin menetapkan diskon individual per siswa dengan alasan terdokumentasi, sehingga subsidi yayasan tercatat secara transparan dan dapat diaudit.
  - [ ] Sebagai Admin, saya ingin melihat tagihan bersih setiap siswa setelah diskon, sehingga Bendahara memiliki angka yang benar saat menerima pembayaran.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Akses dari Tab "Skema Pembayaran" di profil siswa*: Tombol "Atur Skema" tersedia di awal tahun pelajaran
  - [ ] *Form Diskon (Side Drawer)*: Pilih Kategori (multi-select atau "Semua"), toggle Persen/Nominal Tetap, input nilai, dropdown Alasan. Preview real-time di kanan: Tarif Dasar → Diskon → **Tagihan Bersih** (bold hijau)
  - [ ] *Lock Mechanism*: Setelah periode konfigurasi berakhir, tombol digantikan badge "Terkunci 🔒" + tooltip penjelasan

- [ ] **Advanced Users & Edge Cases**
  - [ ] Super Admin dapat override lock dengan alasan wajib yang tercatat di audit log
  - [ ] Diskon > tarif: info banner "Tagihan bersih = Rp 0. Siswa terbebas dari kategori ini."

---

#### 8b. Pencatatan Pembayaran SPP

- [ ] **User Stories**
  - [ ] Sebagai Bendahara, saya ingin mencatat pembayaran SPP dengan alur yang cepat dan minim klik, sehingga proses di loket tidak membuat antrian.
  - [ ] Sebagai Bendahara, saya ingin sistem menampilkan tagihan bersih setelah diskon secara otomatis, sehingga tidak perlu hitung manual.
  - [ ] Sebagai Bendahara, saya ingin mencatat pembayaran beberapa bulan sekaligus, sehingga siswa yang membayar di muka dapat dilayani dengan mudah.
  - [ ] Sebagai Bendahara, saya ingin sistem memperingatkan saya jika ada kelebihan bayar, sehingga saya langsung dapat mengembalikan kembalian kepada wali.

##### UX/UI Considerations

**Perjalanan Pengguna:** "Catat Pembayaran SPP" → Pilih siswa (autocomplete) → Load tagihan → Pilih periode → Input nominal → Kalkulasi live → Simpan → Receipt modal.

- [ ] **Core Experience**
  - [ ] *Step 1 — Pilih Siswa*: Search autocomplete debounce. Saat dipilih → kartu info siswa: foto, nama, kelas, status enrollment — konfirmasi visual Bendahara memilih orang yang benar
  - [ ] *Step 2 — Pilih Periode & Tagihan*: Checkbox list periode belum/sebagian dibayar. Setiap item: bulan-tahun, tagihan bersih, status sebelumnya. Multi-select. Total akumulasi real-time di footer section
  - [ ] *Step 3 — Input Pembayaran*: Input "Jumlah Dibayarkan" (format Rp). Komponen kalkulasi live:
    - Tagihan Total: Rp 750.000
    - Dibayarkan: Rp [input]
    - Kekurangan Rp X (merah) / Kelebihan Rp X (kuning)
  - [ ] *Overpayment Banner*: Banner kuning + ikon ⚠ tidak dapat di-dismiss sampai submit: "Kelebihan bayar Rp 25.000 — harap kembalikan kepada wali siswa."
  - [ ] *Step 4 — Detail Transaksi*: Tanggal (default hari ini, editable), Metode (toggle card: Tunai / Transfer), Catatan opsional. Tombol "Simpan Pembayaran" primary
  - [ ] *Post-Save Receipt Modal*: Nama siswa, kelas, periode, jumlah, metode, nomor referensi sistem. Tombol "Cetak Kwitansi" (print browser) + "Selesai"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Pembayaran parsial: disimpan dengan status "Sebagian", sisa terlacak otomatis
  - [ ] Tagihan bulan ini belum digenerate: info "Tagihan bulan ini belum tersedia" + opsi generate manual

---

#### 8b.2 Reversal Transaksi

- [ ] **User Stories**
  - [ ] Sebagai Bendahara, saya ingin membatalkan transaksi yang keliru dengan mencatat reversal beserta alasannya, sehingga data tetap akurat tanpa menghapus jejak transaksi asli.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Akses*: `···` per baris di riwayat pembayaran → "Catat Reversal" (hanya tersedia untuk transaksi belum di-reverse)
  - [ ] *Reversal Side Drawer*: Detail transaksi asal (read-only di atas sebagai referensi), input wajib Alasan (dropdown + free text), tombol konfirmasi
  - [ ] *Post-Reversal*: Transaksi asli: label "Reversed" + strikethrough + background merah muda. Transaksi reversal baru di bawahnya: ikon ↩ + link ke ID transaksi asal

---

#### 8c. Monitoring & Matriks SPP

- [ ] **User Stories**
  - [ ] Sebagai Bendahara, saya ingin melihat matriks pembayaran seluruh siswa vs semua periode dalam satu pandangan, sehingga tunggakan dapat diidentifikasi dengan cepat.
  - [ ] Sebagai Bendahara, saya ingin mengklik sel di matriks untuk langsung mencatat pembayaran, sehingga tidak perlu navigasi terpisah ke form.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Matriks Layout*: Tabel sticky — kolom nama siswa freeze kiri, header bulan freeze atas. Sel: kotak warna solid (bukan teks). Filter kelas wajib tersedia di atas matriks
  - [ ] *Legenda (non-dismissible)*: 🟢 Lunas, 🔴 Belum Bayar, 🟡 Sebagian, ⚫ Tidak Wajib
  - [ ] *Hover Tooltip*: Periode, Tagihan Bersih, Dibayar, Sisa, Tanggal Bayar Terakhir
  - [ ] *Klik Sel → Input Cepat*: Side drawer "Input Cepat" — context siswa + periode terisi otomatis, langsung ke step input nominal
  - [ ] *Mobile Matriks*: Karena tabel horizontal lebar, pada mobile matriks ditampilkan dalam orientasi landscape dengan horizontal scroll. Filter kelas tersedia sebagai dropdown di atas. Alternatif: mobile menawarkan tampilan "Daftar Tunggakan" sebagai default pengganti matriks

- [ ] **Advanced Users & Edge Cases**
  - [ ] Matriks >100 siswa: virtual scroll pada baris
  - [ ] Filter kelas refresh matriks dengan fade animation

---

#### 8d. Laporan & Ekspor SPP

- [ ] **User Stories**
  - [ ] Sebagai Bendahara/Kepala Sekolah, saya ingin melihat laporan rekap pemasukan SPP per periode, kelas, kategori, dan tahun pelajaran, sehingga kinerja keuangan dapat dimonitor dan dilaporkan.

##### UX/UI Considerations

- [ ] **Core Experience**
  - [ ] *Halaman Laporan SPP*: Filter — Tahun Pelajaran, Bulan/Rentang, Kelas, Kategori. Summary cards: Total Pemasukan, Total Tunggakan, Persentase Pembayaran (progress ring visual). Tabel rekap di bawah
  - [ ] *Ekspor*: Tombol "Ekspor Excel" dan "Ekspor PDF" di kanan atas. PDF: header unit + filter aktif + tabel + placeholder tanda tangan Bendahara

---

### 9. Manajemen Arus Kas (Cashflow)

#### 9.1 Pencatatan & Laporan Transaksi Kas

- [ ] **User Stories**
  - [ ] Sebagai Bendahara, saya ingin mencatat transaksi pemasukan dan pengeluaran dengan cepat, sehingga buku kas selalu up-to-date.
  - [ ] Sebagai Bendahara, saya ingin mengelola kategori cashflow sendiri, sehingga laporan dapat dikelompokkan sesuai kebutuhan unit.
  - [ ] Sebagai Bendahara/Kepala Sekolah, saya ingin melihat laporan arus kas dengan grafik tren, sehingga kondisi keuangan dapat dipahami secara visual.
  - [ ] Sebagai Bendahara, saya ingin mengekspor laporan cashflow ke Excel atau PDF, sehingga laporan dapat disampaikan ke pengurus yayasan.

##### UX/UI Considerations

**Perjalanan Pengguna:** Sidebar → "Arus Kas" → Halaman cashflow (tabel + chart) → "Tambah Transaksi" → Modal → Simpan → Baris baru + summary cards update.

- [ ] **Core Experience**
  - [ ] *Page Layout*: 3 summary cards di atas: Total Pemasukan (hijau), Total Pengeluaran (merah), Saldo Bersih (biru — merah + ikon ⚠ jika negatif). Di bawah: chart tren bulanan + tabel transaksi
  - [ ] *Filter*: Date range picker, dropdown Kategori, toggle Jenis (Semua/Pemasukan/Pengeluaran). Filter aktif ditampilkan sebagai chip removable
  - [ ] *Tabel Kolom*: Tanggal, Jenis (chip: Pemasukan=hijau, Pengeluaran=merah), Kategori, Deskripsi, Jumlah (warna sesuai jenis), Metode, No. Referensi, Aksi (`···`: Edit, Hapus — kecuali transaksi SPP auto-link)
  - [ ] *Aksi Per Baris*: Ikon `···` → popover: "Edit", "Hapus". Transaksi SPP auto-link: `···` hanya menampilkan "Lihat Detail SPP" — edit/hapus dikunci
  - [ ] *Bulk Action Bar (Floating)*: Muncul di bawah layar saat ≥1 baris dicentang. Menu: "Ekspor Terpilih", "Batalkan Seleksi"
  - [ ] *Tambah Transaksi Modal*: Toggle besar "Pemasukan ↔ Pengeluaran" di atas — mengubah accent color seluruh modal (hijau/merah) sebagai visual feedback kuat. Field: Tanggal\*, Kategori\* (dropdown + "Tambah Kategori Baru" inline → nested modal kecil), Deskripsi\*, Jumlah\*, Metode\*, No. Referensi opsional
  - [ ] *SPP Auto-Link Badge*: Badge "SPP" + ikon gembok pada baris dari pembayaran SPP. Tooltip: "Transaksi ini ter-link dari pembayaran SPP. Edit di modul SPP."
  - [ ] *Ekspor*: Tombol "Ekspor Excel" dan "Ekspor PDF" di kanan atas. PDF: header unit + rentang filter + tabel + placeholder tanda tangan
  - [ ] *Empty State*: Dashboard shell utuh. Area konten: ilustrasi buku kas kosong + "Belum ada transaksi tercatat" + CTA "Kembali" dan "Ke Beranda"

- [ ] **Advanced Users & Edge Cases**
  - [ ] Saldo kas negatif: summary card Saldo Bersih merah + ikon ⚠ + tooltip "Pengeluaran melebihi pemasukan dalam periode ini"
  - [ ] Kelola kategori cashflow: sub-halaman "Kelola Kategori" diakses via link kecil di filter bar — tidak memerlukan halaman pengaturan tersendiri. Kategori yang sudah memiliki transaksi tidak dapat dihapus — hanya dinonaktifkan

---

### 10. Kalender Kegiatan

#### 10.1 Tampilan & Manajemen Kegiatan

- [ ] **User Stories**
  - [ ] Sebagai Admin, saya ingin menambahkan kegiatan sekolah lengkap dengan kategori, tanggal, dan status, sehingga seluruh warga sekolah dapat merujuk ke jadwal yang terpusat.
  - [ ] Sebagai pengguna (semua role), saya ingin beralih antara tampilan tabel dan kalender, sehingga saya dapat melihat jadwal dalam format yang paling sesuai konteks saya.
  - [ ] Sebagai pengguna, saya ingin melihat ringkasan statistik kegiatan di atas halaman, sehingga kondisi kalender dapat dipahami sekilas pandang.
  - [ ] Sebagai Admin, saya ingin mengedit dan membatalkan kegiatan, sehingga perubahan jadwal segera direfleksikan di sistem.

##### UX/UI Considerations

**Perjalanan Pengguna (DataTable):** Sidebar → "Kalender" → Tab DataTable (default) → Filter → `···` per baris → Lihat detail / Edit / Batalkan.

**Perjalanan Pengguna (Kalender):** Klik tab Kalender → Navigasi bulan → Klik chip event → Side drawer detail. Atau klik tanggal kosong → Side drawer "Tambah Kegiatan" dengan tanggal ter-prefill.

- [ ] **Core Experience**
  - [ ] *Summary Cards (4 kartu, non-clickable)*:
    - **Total Kegiatan** — ikon kalender, aksen biru, jumlah seluruh kegiatan tahun pelajaran aktif
    - **Kegiatan Dibatalkan** — ikon X, aksen merah
    - **Lomba** — ikon trofi, aksen amber/emas
    - **Tanpa Tanggal** — ikon tanda tanya, aksen abu-abu
    Semua kartu: angka besar bold, label kecil muted, hover elevation ringan

  - [ ] *Tab Toggle*: "📋 Daftar" dan "📅 Kalender". Tab aktif: underline indicator slide animation 150ms. State tab dipertahankan saat kembali ke halaman

  - [ ] *Tab DataTable*:
    - Filter bar: Kategori (multi-select chip), Status (dropdown), Rentang Tanggal (date range picker), Search
    - Tabel kolom: Nama Kegiatan (bold), Kategori (badge berwarna per kategori: Lomba=amber, Rutin=biru, Rapat=ungu, Libur=merah), Tanggal Mulai, Durasi (otomatis: "3 hari"), Lokasi, Status (badge), Aksi (`···`)
    - Aksi per baris via `···` → popover: "Lihat Detail", "Edit", "Batalkan Kegiatan". Popover menutup otomatis
    - Baris dibatalkan: strikethrough + opacity 50%
    - Bulk Action Bar (floating): muncul saat ≥1 baris dicentang. Menu: "Batalkan Terpilih", "Ekspor", "Batalkan Seleksi"
    - Empty state: dashboard shell utuh + ilustrasi kalender kosong + CTA "Kembali" dan "Ke Beranda"

  - [ ] *Tab Kalender*:
    - Grid 7×5/6. Header bulan + navigasi ← → dengan slide horizontal animation. Hari ini: lingkaran background `#1B4332`
    - Event chips per tanggal: latar berwarna sesuai kategori, label truncated. >2 event: tampil 2 chip + "+N lainnya" → klik membuka popover daftar lengkap hari itu
    - Klik chip → side drawer detail
    - Klik tanggal kosong (hanya Admin): side drawer "Tambah Kegiatan" dengan tanggal mulai ter-prefill
    - **Panel "Kegiatan Tanpa Tanggal"** di bawah grid: list chip nama kegiatan. Klik → side drawer edit untuk mengisi tanggal. Header panel: "X kegiatan belum terjadwal"
    - Mobile Kalender: grid tetap ditampilkan namun dalam lebar penuh. Chip event lebih kecil. Navigasi bulan via swipe horizontal + tombol ← →

  - [ ] *Side Drawer Detail/Edit Kegiatan*:
    - Mode baca: nama (H2), badge kategori + status, Tanggal, Lokasi, Deskripsi. Footer: "Edit" (primary) + "Batalkan Kegiatan" (destructive outlined)
    - Mode edit: form inline dalam drawer yang sama — tidak membuka drawer baru
    - Konfirmasi pembatalan: dialog dengan alasan opsional. Post-batal: chip kalender berubah abu-abu + strikethrough; summary card "Dibatalkan" auto-increment dengan counter animation

- [ ] **Advanced Users & Edge Cases**
  - [ ] Event multi-hari v1: chip pada hari pertama dengan label "5–7 Mei". V2: chip melebar melintasi kolom
  - [ ] Tambah kegiatan dari bulan non-aktif di kalender: tanggal ter-prefill, dapat diubah di form
  - [ ] Kegiatan lampau dengan status "Berlangsung": tidak di-auto-update oleh sistem — Admin harus manual update ke "Selesai" untuk menjaga integritas audit trail

---

*Dokumen ini bersifat living document — diperbarui seiring iterasi kolaborasi produk EDARA.*