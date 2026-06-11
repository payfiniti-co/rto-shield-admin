import bcrypt from 'bcryptjs'
import type { RequestHandler } from 'express'

// Single-admin auth: a password is checked against ADMIN_PASSWORD_HASH and the
// result is stored in the session. There is no user table.

declare module 'express-session' {
  interface SessionData {
    authed?: boolean
  }
}

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ?? ''

/** Returns true if the supplied password matches the configured admin hash. */
export async function verifyPassword(password: string): Promise<boolean> {
  if (!ADMIN_PASSWORD_HASH) {
    console.warn('[auth] ADMIN_PASSWORD_HASH is not set — login will always fail.')
    return false
  }
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH)
}

/** Express middleware that rejects unauthenticated requests with 401. */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session?.authed) {
    next()
    return
  }
  res.status(401).json({ error: 'Unauthorized' })
}
