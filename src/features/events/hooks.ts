import { useQuery } from '@tanstack/react-query'
import { fetchEventById, fetchEvents } from './queries'

export const eventsKeys = {
  all: ['events'] as const,
  byId: (id: string) => ['events', id] as const,
}

export function useEvents() {
  return useQuery({
    queryKey: eventsKeys.all,
    queryFn: fetchEvents,
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: id ? eventsKeys.byId(id) : ['events', 'none'],
    queryFn: () => fetchEventById(id as string),
    enabled: Boolean(id),
  })
}
