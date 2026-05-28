import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const notesRoutes = new Hono<HonoEnv>()
