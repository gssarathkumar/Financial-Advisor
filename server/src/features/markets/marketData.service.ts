export type Quote = {
  symbol: string
  name: string
  price: number
  changePercent: number
  currency: string
}

export interface MarketDataProvider {
  search(query: string): Promise<Array<Pick<Quote, 'symbol' | 'name'>>>
  quote(symbol: string): Promise<Quote | null>
}

const sampleQuotes: Quote[] = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50', price: 24812.6, changePercent: 0.82, currency: 'INR' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1685.4, changePercent: 1.24, currency: 'INR' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3924.1, changePercent: -0.38, currency: 'INR' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 1412.85, changePercent: 0.56, currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys', price: 1519.3, changePercent: 0.92, currency: 'INR' },
  { symbol: 'ETERNAL', name: 'Eternal', price: 311.2, changePercent: -1.07, currency: 'INR' },
]

const mockProvider: MarketDataProvider = {
  async search(query) {
    const normalized = query.trim().toLowerCase()
    return sampleQuotes
      .filter(item => `${item.name} ${item.symbol}`.toLowerCase().includes(normalized))
      .map(({ symbol, name }) => ({ symbol, name }))
  },
  async quote(symbol) {
    return sampleQuotes.find(item => item.symbol.toLowerCase() === symbol.toLowerCase()) ?? null
  },
}

const alphaVantageProvider: MarketDataProvider = {
  async search(query) {
    const results = await alphaRequest({ function: 'SYMBOL_SEARCH', keywords: query })
    return (results.bestMatches ?? []).map((item: Record<string, string>) => ({ symbol: item['1. symbol'], name: item['2. name'] }))
  },
  async quote(symbol) {
    const results = await alphaRequest({ function: 'GLOBAL_QUOTE', symbol })
    const item = results['Global Quote']
    if (!item?.['05. price']) return null
    return {
      symbol: item['01. symbol'],
      name: item['01. symbol'],
      price: Number(item['05. price']),
      changePercent: Number.parseFloat(item['10. change percent']),
      currency: 'USD',
    }
  },
}

async function alphaRequest(params: Record<string, string>) {
  const key = process.env.ALPHA_VANTAGE_API_KEY
  if (!key) throw new Error('ALPHA_VANTAGE_API_KEY is required for the live market provider.')
  const url = new URL('https://www.alphavantage.co/query')
  for (const [name, value] of Object.entries({ ...params, apikey: key })) url.searchParams.set(name, value)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Market provider responded with ${response.status}.`)
  const payload = await response.json() as Record<string, any>
  if (payload.Note || payload.Information) throw new Error('Market provider request limit reached.')
  return payload
}

export const marketDataProvider = process.env.MARKET_DATA_PROVIDER === 'alpha-vantage' ? alphaVantageProvider : mockProvider