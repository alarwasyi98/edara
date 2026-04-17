import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Student } from '../data/schema'

type StudentDialogType = 'add' | 'edit' | 'import' | 'export' | 'delete'

type StudentContextType = {
    open: StudentDialogType | null
    setOpen: (str: StudentDialogType | null) => void
    currentRow: Student | null
    setCurrentRow: React.Dispatch<React.SetStateAction<Student | null>>
}

const StudentContext = React.createContext<StudentContextType | null>(null)

export function StudentProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useDialogState<StudentDialogType>(null)
    const [currentRow, setCurrentRow] = useState<Student | null>(null)

    return (
        <StudentContext value={{ open, setOpen, currentRow, setCurrentRow }}>
            {children}
        </StudentContext>
    )
}

export const useStudent = () => {
    const ctx = React.useContext(StudentContext)
    if (!ctx) throw new Error('useStudent must be used within <StudentProvider>')
    return ctx
}