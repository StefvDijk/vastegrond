import { Hono } from 'hono'
import type { HonoEnv } from '../index'

export const guestsRoutes = new Hono<HonoEnv>()
