import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type Student } from '../data/schema'

type SiswaDialogType = 'add' | 'edit' | 'import' | 'export' | 'delete'

type SiswaContextType = {
    open: SiswaDialogType | null
    setOpen: (str: SiswaDialogType | null) => void
    currentRow: Student | null
    setCurrentRow: React.Dispatch<React.SetStateAction<Student | null>>
}

const SiswaContext = React.createContext<SiswaContextType | null>(null)

export function SiswaProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useDialogState<SiswaDialogType>(null)
    const [currentRow, setCurrentRow] = useState<Student | null>(null)

    return (
        <SiswaContext value={{ open, setOpen, currentRow, setCurrentRow }}>
            {children}
        </SiswaContext>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSiswa = () => {
    const ctx = React.useContext(SiswaContext)
    if (!ctx) throw new Error('useSiswa must be used within <SiswaProvider>')
    return ctx
}
