import test from 'node:test'
import assert from 'node:assert/strict'

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

test('verifier does not count an interpolated C# expression as literal output content', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'ready' }] },
    'var status = "ready"; Console.WriteLine($"Status: {status}");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier still counts literal content around a C# interpolation', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Status:' }] },
    'var status = "ready"; Console.WriteLine($"Status: {status}");',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('verifier does not count string literals nested inside C# interpolation expressions', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'ready' }] },
    'Console.WriteLine($"Status: {Get("ready")}");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})
