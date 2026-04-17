import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'

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

type TeacherDialogType = 'add' | 'edit' | 'import' | 'export' | 'delete'

type TeacherContextType = {
    open: TeacherDialogType | null
    setOpen: (str: TeacherDialogType | null) => void
    currentRow: Teacher | null
    setCurrentRow: React.Dispatch<React.SetStateAction<Teacher | null>>
}

const TeacherContext = React.createContext<TeacherContextType | null>(null)

export function TeacherProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useDialogState<TeacherDialogType>(null)
    const [currentRow, setCurrentRow] = useState<Teacher | null>(null)

    return (
        <TeacherContext value={{ open, setOpen, currentRow, setCurrentRow }}>
            {children}
        </TeacherContext>
    )
}

export const useTeacher = () => {
    const ctx = React.useContext(TeacherContext)
    if (!ctx) throw new Error('useTeacher must be used within <TeacherProvider>')
    return ctx
}