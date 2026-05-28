import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const expensesRoutes = new Hono<HonoEnv>()
