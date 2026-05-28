import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const coursesRoutes = new Hono<HonoEnv>()
