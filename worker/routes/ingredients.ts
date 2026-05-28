import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const ingredientsRoutes = new Hono<HonoEnv>()
