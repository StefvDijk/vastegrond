import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const ingredientsRoutes = new Hono<HonoEnv>()
