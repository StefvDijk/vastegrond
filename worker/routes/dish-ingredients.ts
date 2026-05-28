import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const dishIngredientsRoutes = new Hono<HonoEnv>()
