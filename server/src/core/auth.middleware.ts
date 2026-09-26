import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export type AuthRequest = Request & { userId?: string }

export function requireAuth(request: AuthRequest, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  const secret = process.env.JWT_ACCESS_SECRET
  if (!token || !secret) return response.status(401).json({ error: 'Authentication required.' })

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload
    if (typeof payload.sub !== 'string') throw new Error('Invalid token subject')
    request.userId = payload.sub
    next()
  } catch {
    return response.status(401).json({ error: 'Session expired. Please sign in again.' })
  }
}