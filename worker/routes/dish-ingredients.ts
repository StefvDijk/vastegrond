import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const dishIngredientsRoutes = new Hono<HonoEnv>()
