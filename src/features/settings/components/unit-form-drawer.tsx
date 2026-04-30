import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { unitLevelGroups } from '@/lib/constants'
import { createUnitSchema } from '@/lib/validators/tenant'
import { useCreateUnit, useUpdateUnit } from '../hooks'
import type { UnitCardData } from './unit-card'

type UnitFormValues = z.infer<typeof createUnitSchema>

interface UnitFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUnit: UnitCardData | null
}

const defaultValues: UnitFormValues = {
  name: '',
  level: '',
  npsn: null,
  address: null,
  phone: null,
}

export function UnitFormDrawer({
  open,
  onOpenChange,
  editingUnit,
}: UnitFormDrawerProps) {
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const isEditing = editingUnit !== null
  const isPending = createUnit.isPending || updateUnit.isPending

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(createUnitSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open && editingUnit) {
      form.reset({
        name: editingUnit.name,
        level: editingUnit.level,
        npsn: editingUnit.npsn,
        address: null,
        phone: null,
      })
    } else if (open) {
      form.reset(defaultValues)
    }
  }, [open, editingUnit, form])

  const onSubmit = (values: UnitFormValues) => {
    if (isEditing) {
      updateUnit.mutate(
        { id: editingUnit.id, ...values },
        {
          onSuccess: () => {
            onOpenChange(false)
          },
        },
      )
    } else {
      createUnit.mutate(values, {
        onSuccess: () => {
          onOpenChange(false)
        },
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col sm:max-w-[480px]'>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Unit' : 'Tambah Unit Baru'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Perbarui informasi unit pendidikan.'
              : 'Isi data unit pendidikan yang akan ditambahkan.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-4'>
          <Form {...form}>
            <form
              id='unit-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <fieldset className='space-y-4'>
                <legend className='text-sm font-medium text-muted-foreground'>
                  Identitas Unit
                </legend>

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder='Contoh: MTs Ulul Ilmi' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='level'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jenjang *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Pilih jenjang' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unitLevelGroups.map((group) => (
                            <SelectGroup key={group.label}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='npsn'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPSN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='8 digit angka'
                          maxLength={8}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>

              <fieldset className='space-y-4'>
                <legend className='text-sm font-medium text-muted-foreground'>
                  Lokasi & Kontak
                </legend>

                <FormField
                  control={form.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          className='resize-none'
                          placeholder='Alamat lengkap unit'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Telepon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Contoh: 021-1234567'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
            </form>
          </Form>
        </div>

        <SheetFooter className='flex-row justify-end gap-2 border-t px-4 py-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type='submit' form='unit-form' disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
