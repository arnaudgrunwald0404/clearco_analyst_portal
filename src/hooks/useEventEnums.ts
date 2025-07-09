import { useState, useEffect } from 'react'

interface EnumOption {
  value: string
  label: string
}

interface EventEnums {
  eventTypes: EnumOption[]
  eventStatuses: EnumOption[]
  audienceGroups: EnumOption[]
  participationTypes: EnumOption[]
}

export function useEventEnums() {
  const [enums, setEnums] = useState<EventEnums | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/events/enums')
        if (!response.ok) {
          throw new Error('Failed to fetch enum values')
        }
        
        const result = await response.json()
        if (result.success) {
          setEnums(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch enum values')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEnums()
  }, [])

  return { enums, loading, error }
}
