export type RiskLevel = 'conservative' | 'moderate' | 'aggressive'
export type Horizon = 'short' | 'medium' | 'long'

export type Allocation = { equity: number; debt: number; gold: number; cash: number }

const baseAllocations: Record<RiskLevel, Allocation> = {
  conservative: { equity: 25, debt: 60, gold: 10, cash: 5 },
  moderate: { equity: 55, debt: 30, gold: 10, cash: 5 },
  aggressive: { equity: 75, debt: 15, gold: 7, cash: 3 },
}

export function buildAdvice(riskLevel: RiskLevel, horizon: Horizon) {
  const allocation = { ...baseAllocations[riskLevel] }
  if (horizon === 'short') {
    allocation.equity -= 15
    allocation.debt += 15
  } else if (horizon === 'long' && riskLevel !== 'conservative') {
    allocation.equity += 5
    allocation.debt -= 5
  }
  const rationale = [
    `${riskLevel[0].toUpperCase()}${riskLevel.slice(1)} risk preference informs the starting mix.`,
    horizon === 'short' ? 'A shorter horizon increases the debt allocation to reduce volatility.' : 'The allocation reflects your stated investment horizon.',
    'Review periodically; these educational targets are not personal investment advice.',
  ]
  return { allocation, rationale }
}