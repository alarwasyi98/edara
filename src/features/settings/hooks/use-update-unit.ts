import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orpc } from '@/lib/orpc-react'

export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.tenant.units.update.mutationOptions({
      onSuccess: () => {
        toast.success('Unit berhasil diperbarui')
        void queryClient.invalidateQueries({
          queryKey: orpc.tenant.schools.key(),
        })
      },
      onError: (error) => {
        toast.error('Gagal memperbarui unit', {
          description: error.message,
        })
      },
    }),
  )
}
