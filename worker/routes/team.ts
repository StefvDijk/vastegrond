import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const teamRoutes = new Hono<HonoEnv>()
