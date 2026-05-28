import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const inspirationsRoutes = new Hono<HonoEnv>()
