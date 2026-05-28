import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const coursesRoutes = new Hono<HonoEnv>()
