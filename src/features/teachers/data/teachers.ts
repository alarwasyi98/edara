import { faker } from '@faker-js/faker'

faker.seed(54321)

const mataPelajaran = [
    'Al-Quran Hadits',
    'Aqidah Akhlak',
    'Fiqih',
    'SKI',
    'Bahasa Arab',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Matematika',
    'IPA',
    'IPS',
    'PKn',
    'Seni Budaya',
    'PJOK',
    'Prakarya',
    'TIK',
]

const pendidikan = ['S1', 'S2', 'S3', 'D4']

const firstNamesL = [
    'Ustadz Ahmad',
    'Ustadz Hasan',
    'Ustadz Ridwan',
    'Pak Budi',
    'Pak Darmawan',
    'Pak Eko',
    'Pak Farid',
    'Pak Gunawan',
]

const firstNamesP = [
    'Ustadzah Fatimah',
    'Ustadzah Khadijah',
    'Ibu Sari',
    'Ibu Dewi',
    'Ibu Ratna',
    'Ibu Nur',
    'Ibu Wati',
    'Ibu Ani',
]

const lastNames = [
    'Hidayatullah',
    'Nugroho',
    'Pratama',
    'Maulana',
    'Santoso',
    'Permana',
    'Kurniawan',
    'Wibowo',
    'Hakim',
    'Rahman',
]

const kota = [
    'Jakarta',
    'Bandung',
    'Surabaya',
    'Yogyakarta',
    'Semarang',
    'Malang',
    'Bogor',
]

export const teachers = Array.from({ length: 32 }, () => {
    const gender = faker.helpers.arrayElement(['L', 'P'] as const)
    const firstName = faker.helpers.arrayElement(
        gender === 'L' ? firstNamesL : firstNamesP
    )
    const lastName = faker.helpers.arrayElement(lastNames)

    return {
        id: faker.string.uuid(),
        nip: `19${faker.string.numeric(6)}${faker.string.numeric(6)}${faker.string.numeric(4)}`,
        namaLengkap: `${firstName} ${lastName}`,
        jenisKelamin: gender,
        tempatLahir: faker.helpers.arrayElement(kota),
        tanggalLahir: faker.date.birthdate({ min: 25, max: 55, mode: 'age' }),
        mataPelajaran: faker.helpers.arrayElement(mataPelajaran),
        pendidikanTerakhir: faker.helpers.arrayElement(pendidikan),
        telepon: `08${faker.string.numeric(10)}`,
        email: faker.internet.email().toLocaleLowerCase(),
        status: faker.helpers.weightedArrayElement([
            { weight: 9, value: 'active' as const },
            { weight: 1, value: 'inactive' as const },
        ]),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }
})
