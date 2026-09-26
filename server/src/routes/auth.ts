import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import { prisma } from '../lib/prisma.js'

export const authRouter = Router()
authRouter.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }))
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) })
const signupInput = credentials.extend({ name: z.string().trim().min(1).max(80) })
const resetRequestInput = z.object({ email: z.string().email().max(254) })
const resetPasswordInput = z.object({ token: z.string().min(32).max(128), password: z.string().min(8).max(128) })
const refreshCookie = 'wealthlens_refresh'
const refreshDays = 30

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function setRefreshCookie(response: Parameters<Parameters<typeof authRouter.post>[1]>[1], token: string) {
  response.cookie(refreshCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: refreshDays * 24 * 60 * 60 * 1000,
  })
}

async function issueSession(userId: string, response: Parameters<Parameters<typeof authRouter.post>[1]>[1]) {
  const accessSecret = process.env.JWT_ACCESS_SECRET
  if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is not configured.')
  const refreshToken = randomBytes(48).toString('base64url')
  await prisma.refreshToken.create({ data: { tokenHash: tokenHash(refreshToken), userId, expiresAt: new Date(Date.now() + refreshDays * 86400000) } })
  setRefreshCookie(response, refreshToken)
  return jwt.sign({}, accessSecret, { subject: userId, expiresIn: '15m' })
}

authRouter.post('/signup', async (request, response, next) => {
  try {
    const parsed = signupInput.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Enter a name, valid email, and password of at least 8 characters.' })
    const email = parsed.data.email.toLowerCase()
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return response.status(409).json({ error: 'An account with this email already exists.' })
    const user = await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12) }, select: { id: true, name: true, email: true } })
    const accessToken = await issueSession(user.id, response)
    return response.status(201).json({ user: { ...user, needsOnboarding: true }, accessToken })
  } catch (error) { return next(error) }
})

authRouter.post('/login', async (request, response, next) => {
  try {
    const parsed = credentials.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Enter a valid email and password.' })
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, include: { profile: { select: { riskLevel: true } } } })
    if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash)) return response.status(401).json({ error: 'Email or password is incorrect.' })
    const accessToken = await issueSession(user.id, response)
    return response.json({ user: { id: user.id, name: user.name, email: user.email, needsOnboarding: !user.profile, riskLevel: user.profile?.riskLevel ?? undefined }, accessToken })
  } catch (error) { return next(error) }
})

authRouter.post('/refresh', async (request, response, next) => {
  try {
    const oldToken = request.cookies[refreshCookie]
    const accessSecret = process.env.JWT_ACCESS_SECRET
    if (!oldToken || !accessSecret) return response.status(401).json({ error: 'Session expired. Please sign in again.' })
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: tokenHash(oldToken) }, include: { user: { select: { id: true, name: true, email: true, profile: { select: { riskLevel: true } } } } } })
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
      response.clearCookie(refreshCookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth' })
      return response.status(401).json({ error: 'Session expired. Please sign in again.' })
    }
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    const accessToken = await issueSession(stored.user.id, response)
    return response.json({ user: { id: stored.user.id, name: stored.user.name, email: stored.user.email, needsOnboarding: !stored.user.profile, riskLevel: stored.user.profile?.riskLevel ?? undefined }, accessToken })
  } catch (error) { return next(error) }
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    const token = request.cookies[refreshCookie]
    if (token) await prisma.refreshToken.deleteMany({ where: { tokenHash: tokenHash(token) } })
    response.clearCookie(refreshCookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/auth' })
    return response.status(204).end()
  } catch (error) { return next(error) }
})

authRouter.post('/forgot-password', async (request, response, next) => {
  try {
    const parsed = resetRequestInput.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Enter a valid email address.' })
    const deliveryUrl = process.env.EMAIL_DELIVERY_URL
    if (!deliveryUrl) return response.status(503).json({ error: 'Password reset email is not configured on this deployment.' })

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, email: true } })
    if (user) {
      const token = randomBytes(32).toString('hex')
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
      await prisma.passwordResetToken.create({ data: { tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } })
      const resetUrl = new URL('/?token=' + encodeURIComponent(token), process.env.CLIENT_ORIGIN || 'http://localhost:5173').toString()
      const delivery = await fetch(deliveryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.EMAIL_DELIVERY_TOKEN ? { Authorization: `Bearer ${process.env.EMAIL_DELIVERY_TOKEN}` } : {}) },
        body: JSON.stringify({ to: user.email, subject: 'Reset your WealthLens password', text: `This link expires in one hour: ${resetUrl}` }),
      })
      if (!delivery.ok) {
        await prisma.passwordResetToken.deleteMany({ where: { tokenHash: tokenHash(token) } })
        return response.status(503).json({ error: 'The reset email could not be sent. Please try again later.' })
      }
    }
    return response.status(202).json({ message: 'If an account exists for that address, a password reset link will be sent.' })
  } catch (error) { return next(error) }
})

authRouter.post('/reset-password', async (request, response, next) => {
  try {
    const parsed = resetPasswordInput.safeParse(request.body)
    if (!parsed.success) return response.status(400).json({ error: 'Use a valid reset link and a password of at least 8 characters.' })
    const tokenHashValue = tokenHash(parsed.data.token)
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: tokenHashValue } })
    if (!reset || reset.expiresAt < new Date()) {
      if (reset) await prisma.passwordResetToken.delete({ where: { id: reset.id } })
      return response.status(400).json({ error: 'This reset link is invalid or has expired.' })
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } }),
      prisma.refreshToken.deleteMany({ where: { userId: reset.userId } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: reset.userId } }),
    ])
    return response.json({ message: 'Password updated. Sign in with your new password.' })
  } catch (error) { return next(error) }
})