import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const notesRoutes = new Hono<HonoEnv>()
