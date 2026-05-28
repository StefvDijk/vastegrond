import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const eventsRoutes = new Hono<HonoEnv>()
