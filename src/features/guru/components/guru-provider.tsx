import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'

// Minimal inlined type to avoid circular import
type Teacher = {
    id: string
    nip: string
    namaLengkap: string
    jenisKelamin: 'L' | 'P'
    mataPelajaran: string
    pendidikanTerakhir: string
    telepon: string
    email: string
    status: 'active' | 'inactive'
    tempatLahir: string
    tanggalLahir: Date
    createdAt: Date
    updatedAt: Date
}

type GuruDialogType = 'add' | 'edit' | 'import' | 'export' | 'delete'

type GuruContextType = {
    open: GuruDialogType | null
    setOpen: (str: GuruDialogType | null) => void
    currentRow: Teacher | null
    setCurrentRow: React.Dispatch<React.SetStateAction<Teacher | null>>
}

const GuruContext = React.createContext<GuruContextType | null>(null)

export function GuruProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useDialogState<GuruDialogType>(null)
    const [currentRow, setCurrentRow] = useState<Teacher | null>(null)

    return (
        <GuruContext value={{ open, setOpen, currentRow, setCurrentRow }}>
            {children}
        </GuruContext>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useGuru = () => {
    const ctx = React.useContext(GuruContext)
    if (!ctx) throw new Error('useGuru must be used within <GuruProvider>')
    return ctx
}
