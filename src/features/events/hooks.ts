import { useQuery } from '@tanstack/react-query'
import { fetchEventById, fetchEvents } from './queries'
import { SEED_EVENTS, useDevSeed } from '../../lib/devSeed'

export const eventsKeys = {
  all: ['events'] as const,
  byId: (id: string) => ['events', id] as const,
}

export function useEvents() {
  return useQuery({
    queryKey: eventsKeys.all,
    queryFn: async () => {
      try {
        const events = await fetchEvents()
        if (useDevSeed && events.length === 0) {
          return SEED_EVENTS
        }
        return events
      } catch (error) {
        if (useDevSeed) return SEED_EVENTS
        throw error
      }
    },
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: id ? eventsKeys.byId(id) : ['events', 'none'],
    queryFn: async () => {
      try {
        return await fetchEventById(id as string)
      } catch (error) {
        if (useDevSeed) {
          const fallback = SEED_EVENTS.find((e) => e.id === id)
          if (fallback) return fallback
        }
        throw error
      }
    },
    enabled: Boolean(id),
  })
}
