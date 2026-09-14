import test from 'node:test'
import assert from 'node:assert/strict'

const lesson = {
  id: 'test',
  title: 'Test',
  points: 10,
  instructions: 'Test',
  starterCode: '',
  checks: ['Console.WriteLine'],
  successOutput: 'Success',
}

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

function checks(result) {
  return result.passedChecks
}

test('verifier reports complete only when every requirement is present in executable source', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(lesson, 'Console.WriteLine("Hello");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier accepts an explicit structural check without legacy classification', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [{ kind: 'structural', value: 'int credits' }] }, 'int credits = 42;')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
})

test('verifier accepts an explicit output check with a multi-word requirement', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [{ kind: 'output', value: 'Hello, Zenith' }] }, 'Console.WriteLine("Hello, Zenith");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
})

test('verifier accepts an explicit output check with a single-token requirement', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [{ kind: 'output', value: '42' }] }, 'Console.WriteLine("42");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
})

test('verifier rejects a single-token output requirement that is only present structurally', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [{ kind: 'output', value: '42' }] }, 'int answer = 42;')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier accepts an explicit quoted check', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [{ kind: 'quoted', value: 'Console.WriteLine("Hello")' }] }, 'Console.WriteLine("Hello");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
})

test('verifier identifies the first missing requirement and preserves later failures', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['Console.WriteLine', 'return', 'missing'] }, 'Console.WriteLine("Hello"); return;')
  assert.deepEqual(checks(result), [true, true, false])
  assert.equal(result.passedCount, 2)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 2)
})

test('verifier ignores requirements that appear only inside comments', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['Console.WriteLine'] }, '// Console.WriteLine("Hello");')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier does not satisfy structural checks from inside string literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['Console.WriteLine'] }, 'const note = "Console.WriteLine";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier does not satisfy single-token structural checks from inside literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['return'] }, 'const note = "return";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier accepts plain output requirements from inside string literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['Hello, Zenith'] }, 'Console.WriteLine("Hello, Zenith");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier normalizes escaped newline output inside string literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const escapedNewline = String.fromCharCode(92) + 'n'
  const source = `Console.WriteLine("Hello${escapedNewline}Zenith");`
  const result = verifyLessonCode({ ...lesson, checks: ['Hello\nZenith'] }, source)
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier does not satisfy quoted expressions from inside a larger string literal', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['cout << "Hello"'] }, 'const char* note = "cout << \\"Hello\\"";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier rejects a quoted requirement nested inside an escaped string literal', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['cout << "Hello"'] }, 'const char* note = "prefix \\"cout << \\\"Hello\\\"\\" suffix";')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier does not satisfy structural or quoted expressions from inside template literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['return', 'cout << "Hello"'] }, 'const note = `return cout << "Hello"`;')
  assert.deepEqual(checks(result), [false, false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier still supports requirements that intentionally include quoted output', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['Console.WriteLine("Hello")'] }, 'Console.WriteLine("Hello");')
  assert.deepEqual(checks(result), [true])
  assert.equal(result.passedCount, 1)
  assert.equal(result.complete, true)
  assert.equal(result.failedIndex, -1)
})

test('verifier rejects blank requirements', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: ['  '] }, 'anything')
  assert.deepEqual(checks(result), [false])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})

test('verifier fails closed when a malformed lesson has no checks', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode({ ...lesson, checks: [] }, 'Console.WriteLine("Hello");')
  assert.deepEqual(checks(result), [])
  assert.equal(result.passedCount, 0)
  assert.equal(result.complete, false)
  assert.equal(result.failedIndex, 0)
})
