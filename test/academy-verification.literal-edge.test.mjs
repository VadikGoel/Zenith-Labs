import test from 'node:test'
import assert from 'node:assert/strict'

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

test('verifier accepts escaped quotes in a normal C# output string', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith "ready"' }] },
    'Console.WriteLine("Zenith \\"ready\\"");',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('verifier accepts doubled quotes in a C# verbatim output string', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith "ready"' }] },
    'Console.WriteLine(@"Zenith ""ready""");',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('verifier rejects output text that exists only in an unrelated multiline literal', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'var message = @"Zenith ready";\nConsole.WriteLine("other");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})
