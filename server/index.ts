import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import session from 'express-session'
import { prisma } from './db'
import { verifyPassword, requireAuth } from './auth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3001)
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(express.json())

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'dev-insecure-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  }),
)

// --- Auth routes ----------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { password } = req.body ?? {}
  if (typeof password !== 'string' || !(await verifyPassword(password))) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }
  req.session.authed = true
  res.json({ ok: true })
})

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }))
})

app.get('/api/me', (req, res) => {
  res.json({ authed: Boolean(req.session.authed) })
})

// --- Data routes (protected) ---------------------------------------------
// NOTE: field/model names below assume the placeholder schema.prisma. After
// `npm run prisma:pull` introspects the live DB, reconcile these queries.

app.get('/api/merchants', requireAuth, async (_req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { installedAt: 'desc' },
      select: {
        id: true,
        shopifyDomain: true,
        installedAt: true,
        uninstalledAt: true,
        planTier: true,
        riskModelState: true,
      },
    })
    res.json(shops)
  } catch (err) {
    console.error('[merchants]', err)
    res.status(500).json({ error: 'Failed to load merchants' })
  }
})

app.get('/api/errors', requireAuth, async (req, res) => {
  const { level, source, shopId } = req.query
  try {
    const logs = await prisma.errorLog.findMany({
      where: {
        // `level` is the ErrorLevel enum; cast is safe since Prisma validates.
        ...(typeof level === 'string' && level
          ? { level: level as never }
          : {}),
        ...(typeof source === 'string' && source ? { source } : {}),
        // shopId is a String id, not numeric.
        ...(typeof shopId === 'string' && shopId ? { shopId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { shop: { select: { id: true, shopifyDomain: true } } },
    })
    res.json(logs)
  } catch (err) {
    console.error('[errors]', err)
    res.status(500).json({ error: 'Failed to load error logs' })
  }
})

// --- Static frontend (production) -----------------------------------------
if (isProd) {
  const dist = path.resolve(__dirname, '../dist')
  app.use(express.static(dist))
  // SPA fallback for client-side routing.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
