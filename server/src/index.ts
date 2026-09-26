import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRouter } from './features/auth/auth.routes.js'
import { apiRouter } from './features/profile/profile.routes.js'
import { marketRouter } from './features/markets/markets.routes.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.disable('x-powered-by')
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.use('/api/auth', authRouter)
app.use('/api/markets', marketRouter)
app.use('/api', apiRouter)
app.use((_error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
	return response.status(500).json({ error: 'Unexpected server error.' })
})

app.listen(port, () => console.log(`WealthLens API listening on ${port}`))