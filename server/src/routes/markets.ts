import { Router } from 'express'
import { marketDataProvider } from '../services/marketData.js'

export const marketRouter = Router()

marketRouter.get('/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.slice(0, 80) : ''
  if (!query.trim()) return response.json({ results: [] })
  try {
    return response.json({ results: await marketDataProvider.search(query) })
  } catch (error) {
    return response.status(503).json({ error: error instanceof Error ? error.message : 'Market data unavailable.' })
  }
})

marketRouter.get('/quote/:symbol', async (request, response) => {
  try {
    const quote = await marketDataProvider.quote(request.params.symbol.slice(0, 24))
    if (!quote) return response.status(404).json({ error: 'Symbol not found.' })
    return response.json({ quote })
  } catch (error) {
    return response.status(503).json({ error: error instanceof Error ? error.message : 'Market data unavailable.' })
  }
})