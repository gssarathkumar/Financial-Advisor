import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAdvice } from './advisor.js'

test('target allocations always add up to 100 percent', () => {
  for (const risk of ['conservative', 'moderate', 'aggressive'] as const) {
    for (const horizon of ['short', 'medium', 'long'] as const) {
      const { allocation } = buildAdvice(risk, horizon)
      assert.equal(Object.values(allocation).reduce((total, value) => total + value, 0), 100)
    }
  }
})

test('short horizons shift allocation from equity to debt', () => {
  const short = buildAdvice('moderate', 'short').allocation
  const medium = buildAdvice('moderate', 'medium').allocation
  assert.equal(short.equity, medium.equity - 15)
  assert.equal(short.debt, medium.debt + 15)
})

test('long horizon increases equity only for growth-oriented profiles', () => {
  assert.equal(buildAdvice('aggressive', 'long').allocation.equity, 80)
  assert.equal(buildAdvice('conservative', 'long').allocation.equity, 25)
})