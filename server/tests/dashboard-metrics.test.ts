import assert from 'node:assert/strict'
import test from 'node:test'
import { connectedMetrics } from '../../src/features/admin/connectedMetrics.ts'

test('Dashboard conectado: vacío, calendario y cero series ficticias',()=>{
  const result=connectedMetrics([],[],[],new Date('2026-11-11T12:00:00Z'))
  assert.equal(result.labels.length,8)
  for(const key of ['submitted','approved','pending','students','requests'] as const)assert.deepEqual(result[key],Array(8).fill(0))
  assert.equal(result.max,4)
  assert.match(result.labels.at(-1)!,/nov/)
})
