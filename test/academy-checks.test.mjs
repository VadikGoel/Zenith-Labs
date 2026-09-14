import test from 'node:test'
import assert from 'node:assert/strict'

const { normalizeLegacyCheck, normalizeCheck } = await import('../lib/academy-checks.ts')

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

test('normalization trims whitespace while preserving structural classification for single-line tokens', () => {
  assert.deepEqual(normalizeLegacyCheck('  int  '), {
    kind: 'structural',
    value: 'int',
  })
})

test('explicit typed checks bypass legacy classification and preserve their declared kind', () => {
  assert.deepEqual(normalizeCheck({ kind: 'structural', value: '  int credits  ' }), {
    kind: 'structural',
    value: 'int credits',
  })
  assert.deepEqual(normalizeCheck({ kind: 'output', value: 'Hello, Zenith' }), {
    kind: 'output',
    value: 'Hello, Zenith',
  })
  assert.deepEqual(normalizeCheck({ kind: 'quoted', value: '"Zenith"' }), {
    kind: 'quoted',
    value: '"Zenith"',
  })
})
