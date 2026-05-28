import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const dishesRoutes = new Hono<HonoEnv>()
