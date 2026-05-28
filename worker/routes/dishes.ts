import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const dishesRoutes = new Hono<HonoEnv>()
