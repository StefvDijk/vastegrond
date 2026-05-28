import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const eventsRoutes = new Hono<HonoEnv>()
