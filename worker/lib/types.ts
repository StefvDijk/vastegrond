/// <reference types="@cloudflare/workers-types" />

export type HonoEnv = {
  Bindings: {
    DB: D1Database
    R2: R2Bucket
    ASSETS: Fetcher
    JWT_SECRET: string
  }
  Variables: {
    userId: string
    userEmail: string
  }
}
