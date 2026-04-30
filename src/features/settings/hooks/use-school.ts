import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc-react'

export function useSchool() {
  return useQuery(orpc.tenant.schools.get.queryOptions({}))
}
