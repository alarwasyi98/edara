import { useMemo } from 'react'
import { useSchool } from './use-school'

export function useUnits() {
  const schoolQuery = useSchool()

  const units = useMemo(
    () => schoolQuery.data?.units ?? [],
    [schoolQuery.data?.units],
  )

  return {
    data: units,
    isLoading: schoolQuery.isLoading,
    isError: schoolQuery.isError,
    error: schoolQuery.error,
  }
}
