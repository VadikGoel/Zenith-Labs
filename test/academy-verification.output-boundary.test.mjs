import test from 'node:test'
import assert from 'node:assert/strict'

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

test('output checks accept semicolons inside printed string literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const lesson = {
    id: 'semicolon-output',
    title: 'Semicolon output',
    points: 10,
    instructions: 'Test',
    starterCode: '',
    checks: [{ kind: 'output', value: 'alpha;beta' }],
    successOutput: 'Success',
  }
  const result = verifyLessonCode(lesson, 'Console.WriteLine("alpha;beta");')
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('output checks do not cross a literal semicolon into a later statement', async () => {
  const verifyLessonCode = await loadVerifier()
  const lesson = {
    id: 'semicolon-boundary',
    title: 'Semicolon boundary',
    points: 10,
    instructions: 'Test',
    starterCode: '',
    checks: [{ kind: 'output', value: 'alpha;beta' }],
    successOutput: 'Success',
  }
  const result = verifyLessonCode(lesson, 'Console.WriteLine("alpha"); string note = "beta";')
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})
