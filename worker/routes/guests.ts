import { Hono } from 'hono'
import type { HonoEnv } from '../lib/types'

export const guestsRoutes = new Hono<HonoEnv>()
