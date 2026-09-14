import test from 'node:test'
import assert from 'node:assert/strict'

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

test('verifier rejects lookalike Console output method names', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Hello' }] },
    'Console.WriteLineExtra("Hello");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier rejects output calls attached to another namespace or member', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Hello' }] },
    'My.Console.WriteLine("Hello");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier rejects lookalike C++ output functions and namespaces', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Hello' }] },
    'my::cout << "Hello"; my::printf("Hello");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier still accepts supported output calls with exact boundaries', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Hello' }] },
    'Console.WriteLine("Hello"); std::cout << "Hello"; std::printf("Hello");',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})
