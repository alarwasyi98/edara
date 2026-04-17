import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

// ── Types ───────────────────────────────────────

export interface EditField {
    key: string
    label: string
    value: string
    type?: 'text' | 'date' | 'select' | 'tel'
    options?: { label: string; value: string }[]
    readOnly?: boolean
}

interface EditDialogProps {
    title: string
    description: string
    fields: EditField[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

// ── Edit Button ─────────────────────────────────

interface EditButtonProps {
    onClick: () => void
}

export function EditButton({ onClick }: EditButtonProps) {
    return (
        <Button variant='outline' size='sm' className='gap-1.5' onClick={onClick}>
            <Pencil className='h-3.5 w-3.5' />
            Edit Data
        </Button>
    )
}

// ── Edit Dialog ─────────────────────────────────

export function EditDialog({
    title,
    description,
    fields,
    open,
    onOpenChange,
}: EditDialogProps) {
    const [formData, setFormData] = useState<Record<string, string>>(() =>
        Object.fromEntries(fields.map((f) => [f.key, f.value]))
    )
    const [saving, setSaving] = useState(false)

    const handleChange = (key: string, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = () => {
        setSaving(true)
        // Simulate async save
        setTimeout(() => {
            toast.success(`${title} berhasil diperbarui. (Demo)`)
            setSaving(false)
            onOpenChange(false)
        }, 600)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    {fields.map((field) => (
                        <div
                            key={field.key}
                            className='grid grid-cols-4 items-center gap-4'
                        >
                            <Label
                                htmlFor={field.key}
                                className='col-span-4 text-sm sm:col-span-1 sm:text-right'
                            >
                                {field.label}
                            </Label>
                            <div className='col-span-4 sm:col-span-3'>
                                {field.type === 'select' && field.options ? (
                                    <Select
                                        value={formData[field.key]}
                                        onValueChange={(v) =>
                                            handleChange(field.key, v)
                                        }
                                        disabled={field.readOnly}
                                    >
                                        <SelectTrigger id={field.key}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id={field.key}
                                        type={field.type ?? 'text'}
                                        value={formData[field.key]}
                                        onChange={(e) =>
                                            handleChange(
                                                field.key,
                                                e.target.value
                                            )
                                        }
                                        readOnly={field.readOnly}
                                        className={
                                            field.readOnly
                                                ? 'bg-muted text-muted-foreground'
                                                : ''
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        variant='outline'
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
