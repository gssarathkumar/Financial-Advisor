import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { buildAdvice, type Horizon, type RiskLevel } from '../services/advisor.js'

export const apiRouter = Router()
apiRouter.use(requireAuth)

apiRouter.get('/me', async (request: AuthRequest, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: request.userId }, select: { id: true, name: true, email: true, profile: true } })
    if (!user) return response.status(404).json({ error: 'Account not found.' })
    return response.json({ user })
  } catch (error) { return next(error) }
})

const profileSchema = z.object({
  age: z.number().int().min(18).max(100).optional(),
  income: z.string().max(40).optional(),
  goals: z.array(z.string().max(40)).max(10),
  horizon: z.enum(['short', 'medium', 'long']).optional(),
  riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  answers: z.record(z.number().int().min(1).max(3)).optional(),
})

apiRouter.put('/profile', async (request: AuthRequest, response, next) => {
  try {
    const parsed = profileSchema.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Profile details are invalid.' })
    const profile = await prisma.riskProfile.upsert({ where: { userId: request.userId! }, create: { ...parsed.data, userId: request.userId! }, update: parsed.data })
    return response.json({ profile })
  } catch (error) { return next(error) }
})

apiRouter.get('/portfolio', async (request: AuthRequest, response, next) => {
  try {
    const portfolios = await prisma.portfolio.findMany({ where: { userId: request.userId }, include: { holdings: true } })
    return response.json({ portfolios })
  } catch (error) { return next(error) }
})

const holdingInput = z.object({
  symbol: z.string().trim().min(1).max(24),
  name: z.string().trim().min(1).max(120),
  assetType: z.enum(['stock', 'mutual_fund', 'sip', 'cash']),
  quantity: z.number().positive().max(1_000_000_000),
  averageCost: z.number().nonnegative().max(1_000_000_000),
})

apiRouter.post('/portfolio/holdings', async (request: AuthRequest, response, next) => {
  try {
    const parsed = holdingInput.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Enter a valid symbol, asset type, quantity, and average cost.' })
    const portfolio = await prisma.portfolio.findFirst({ where: { userId: request.userId } })
      ?? await prisma.portfolio.create({ data: { userId: request.userId!, name: 'My portfolio' } })
    const holding = await prisma.holding.create({ data: { ...parsed.data, symbol: parsed.data.symbol.toUpperCase(), portfolioId: portfolio.id } })
    return response.status(201).json({ holding })
  } catch (error) { return next(error) }
})

apiRouter.get('/watchlist', async (request: AuthRequest, response, next) => {
  try {
    const items = await prisma.watchlistItem.findMany({ where: { userId: request.userId }, orderBy: { createdAt: 'desc' } })
    return response.json({ items })
  } catch (error) { return next(error) }
})

apiRouter.get('/advice', async (request: AuthRequest, response, next) => {
  try {
    const profile = await prisma.riskProfile.findUnique({ where: { userId: request.userId! } })
    const validRisk = ['conservative', 'moderate', 'aggressive'].includes(profile?.riskLevel ?? '')
    const validHorizon = ['short', 'medium', 'long'].includes(profile?.horizon ?? '')
    const riskLevel = (validRisk ? profile!.riskLevel : 'conservative') as RiskLevel
    const horizon = (validHorizon ? profile!.horizon : 'medium') as Horizon
    return response.json({ ...buildAdvice(riskLevel, horizon), profileComplete: Boolean(profile) })
  } catch (error) { return next(error) }
})