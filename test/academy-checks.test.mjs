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
