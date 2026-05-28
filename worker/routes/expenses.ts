import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const expensesRoutes = new Hono<HonoEnv>()
