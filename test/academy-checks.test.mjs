import test from 'node:test'
import assert from 'node:assert/strict'

async function loadChecks() {
  return import('../lib/academy-checks.ts')
}

test('typed Academy checks preserve their declared verification kind', async () => {
  const { normalizeCheck } = await loadChecks()
  assert.deepEqual(normalizeCheck({ kind: 'output', value: 'Hello, Zenith' }), {
    kind: 'output',
    value: 'Hello, Zenith',
  })
})

test('malformed Academy check objects fail closed instead of becoming structural checks', async () => {
  const { normalizeCheck } = await loadChecks()
  const malformed = [
    { kind: 'unknown', value: 'Console.WriteLine' },
    { kind: 'output', value: 42 },
    null,
  ]

  for (const value of malformed) {
    const normalized = normalizeCheck(value)
    assert.deepEqual(normalized, { kind: 'structural', value: '' })
  }
})

test('Academy check type guard rejects untrusted runtime values', async () => {
  const { isVerificationCheck } = await loadChecks()
  assert.equal(isVerificationCheck({ kind: 'structural', value: 'Console.WriteLine' }), true)
  assert.equal(isVerificationCheck({ kind: 'output', value: 'Hello' }), true)
  assert.equal(isVerificationCheck({ kind: 'quoted', value: '"Hello"' }), true)
  assert.equal(isVerificationCheck({ kind: 'output', value: 42 }), false)
  assert.equal(isVerificationCheck({ kind: 'unknown', value: 'Hello' }), false)
  assert.equal(isVerificationCheck(null), false)
})

test('Academy check type guard rejects empty or whitespace-only typed checks', async () => {
  const { isVerificationCheck, normalizeCheck } = await loadChecks()
  const malformed = [
    { kind: 'structural', value: '' },
    { kind: 'output', value: '   ' },
    { kind: 'quoted', value: '\t' },
  ]

  for (const value of malformed) {
    assert.equal(isVerificationCheck(value), false)
    assert.deepEqual(normalizeCheck(value), { kind: 'structural', value: '' })
  }
})
