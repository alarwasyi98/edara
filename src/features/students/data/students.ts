import { faker } from '@faker-js/faker'

faker.seed(12345)

const kota = [
    'Jakarta',
    'Bandung',
    'Surabaya',
    'Yogyakarta',
    'Semarang',
    'Malang',
    'Bogor',
    'Bekasi',
    'Depok',
    'Tangerang',
]

const kelasList = [
    'VII-A',
    'VII-B',
    'VII-C',
    'VIII-A',
    'VIII-B',
    'VIII-C',
    'IX-A',
    'IX-B',
    'IX-C',
]

const firstNamesL = [
    'Ahmad',
    'Muhammad',
    'Rizki',
    'Fauzan',
    'Hasan',
    'Ridwan',
    'Zaki',
    'Dani',
    'Arif',
    'Galih',
    'Ilham',
    'Fajar',
    'Rafi',
    'Bayu',
    'Irfan',
]

const firstNamesP = [
    'Siti',
    'Nisa',
    'Aisyah',
    'Fatimah',
    'Zahra',
    'Putri',
    'Dewi',
    'Annisa',
    'Rahma',
    'Layla',
    'Khadijah',
    'Amira',
    'Nabila',
    'Salma',
    'Hafsa',
]

const lastNames = [
    'Hidayat',
    'Pratama',
    'Nugroho',
    'Ramadhani',
    'Permana',
    'Saputra',
    'Utami',
    'Lestari',
    'Anggraini',
    'Santoso',
    'Wibowo',
    'Kurniawan',
    'Maulana',
    'Firdaus',
    'Hakim',
]

const pekerjaanList = [
    'PNS',
    'Wiraswasta',
    'Karyawan Swasta',
    'Petani',
    'Pedagang',
    'Guru',
    'Dokter',
    'TNI/Polri',
    'Buruh',
    'Ibu Rumah Tangga',
    'Nelayan',
    'Pensiunan',
]

const kelurahanList = [
    'Sukajadi',
    'Cibaduyut',
    'Cimahi',
    'Antapani',
    'Cibeunying',
    'Coblong',
    'Cicendo',
    'Buahbatu',
    'Kiaracondong',
    'Bandung Kulon',
]

const kecamatanList = [
    'Sukajadi',
    'Bojongloa Kidul',
    'Cimahi Tengah',
    'Antapani',
    'Cibeunying Kaler',
    'Coblong',
    'Cicendo',
    'Bandung Kidul',
    'Kiaracondong',
    'Bandung Kulon',
]

const provinsiList = [
    'Jawa Barat',
    'Jawa Tengah',
    'Jawa Timur',
    'DKI Jakarta',
    'DI Yogyakarta',
    'Banten',
]

export const students = Array.from({ length: 120 }, (_, i) => {
    const gender = faker.helpers.arrayElement(['L', 'P'] as const)
    const firstName = faker.helpers.arrayElement(
        gender === 'L' ? firstNamesL : firstNamesP
    )
    const lastName = faker.helpers.arrayElement(lastNames)
    const tahunMasuk = faker.helpers.arrayElement(['2023', '2024', '2025'])
    const selectedKota = faker.helpers.arrayElement(kota)

    return {
        id: faker.string.uuid(),
        nis: `${tahunMasuk}${String(i + 1).padStart(4, '0')}`,
        nisn: faker.string.numeric(10),
        nikSiswa: faker.string.numeric(16),
        nomorKK: faker.string.numeric(16),
        namaLengkap: `${firstName} ${lastName}`,
        jenisKelamin: gender,
        tempatLahir: faker.helpers.arrayElement(kota),
        tanggalLahir: faker.date.birthdate({ min: 11, max: 15, mode: 'age' }),
        kelas: faker.helpers.arrayElement(kelasList),
        tahunMasuk,
        status: faker.helpers.weightedArrayElement([
            { weight: 8, value: 'active' as const },
            { weight: 1, value: 'graduated' as const },
            { weight: 0.5, value: 'transferred' as const },
            { weight: 0.5, value: 'inactive' as const },
        ]),

        // Orang tua — Ibu
        namaIbuKandung: `${faker.helpers.arrayElement(firstNamesP)} ${faker.helpers.arrayElement(lastNames)}`,
        nikIbu: faker.string.numeric(16),
        pekerjaanIbu: faker.helpers.arrayElement(pekerjaanList),

        // Orang tua — Ayah
        namaAyahKandung: `${faker.helpers.arrayElement(firstNamesL)} ${faker.helpers.arrayElement(lastNames)}`,
        nikAyah: faker.string.numeric(16),
        pekerjaanAyah: faker.helpers.arrayElement(pekerjaanList),

        // Wali
        namaWali: `${faker.helpers.arrayElement(firstNamesL)} ${faker.helpers.arrayElement(lastNames)}`,
        nikWali: faker.string.numeric(16),
        pekerjaanWali: faker.helpers.arrayElement(pekerjaanList),
        teleponWali: `08${faker.string.numeric(10)}`,

        // Alamat
        alamat: `Jl. ${faker.location.street()} No. ${faker.number.int({ min: 1, max: 200 })}`,
        rt: String(faker.number.int({ min: 1, max: 20 })).padStart(3, '0'),
        rw: String(faker.number.int({ min: 1, max: 15 })).padStart(3, '0'),
        kelurahan: faker.helpers.arrayElement(kelurahanList),
        kecamatan: faker.helpers.arrayElement(kecamatanList),
        kabKota: selectedKota,
        provinsi: faker.helpers.arrayElement(provinsiList),
        kodePos: faker.string.numeric(5),

        // Kontak
        nomorHp: `08${faker.string.numeric(10)}`,

        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }
})
