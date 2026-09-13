import test from 'node:test'
import assert from 'node:assert/strict'

const { normalizeLegacyCheck } = await import('../lib/academy-checks.ts')

test('legacy structural checks normalize explicitly', () => {
  assert.deepEqual(normalizeLegacyCheck('Console.WriteLine'), {
    kind: 'structural',
    value: 'Console.WriteLine',
  })
})

test('legacy output checks normalize explicitly', () => {
  assert.deepEqual(normalizeLegacyCheck('Hello, Zenith'), {
    kind: 'output',
    value: 'Hello, Zenith',
  })
})

test('legacy quoted checks preserve quoted semantics', () => {
  assert.deepEqual(normalizeLegacyCheck('"Zenith"'), {
    kind: 'quoted',
    value: '"Zenith"',
  })
})

test('normalization trims whitespace before classification', () => {
  assert.deepEqual(normalizeLegacyCheck('  int credits  '), {
    kind: 'structural',
    value: 'int credits',
  })
})
