import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpc } from '@/lib/orpc-react'

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.tenant.units.create.mutationOptions({
      onSuccess: () => {
        toast.success('Unit berhasil ditambahkan')
        void queryClient.invalidateQueries({
          queryKey: orpc.tenant.schools.key(),
        })
      },
      onError: (error) => {
        toast.error('Gagal menambahkan unit', {
          description: error.message,
        })
      },
    }),
  )
}
