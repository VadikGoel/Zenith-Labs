import test from 'node:test'
import assert from 'node:assert/strict'

async function loadVerifier() {
  return (await import('../lib/academy-verification.ts')).verifyLessonCode
}

test('verifier ignores required structural text inside comments', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'int total = 42;' }] },
    '// int total = 42;\n/* int total = 42; */\nint answer = 1;',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier ignores required structural text inside string and character literals', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'int total = 42;' }] },
    'var text = "int total = 42;";\nvar marker = \'x\';',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier rejects structural requirements embedded in longer identifiers', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'total' }] },
    'int totalValue = 42; int subtotal = 1;',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier rejects structural requirements embedded in Unicode identifiers', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'total' }] },
    'int cafétotal = 42;',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier rejects structural requirements embedded after a combining mark', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'total' }] },
    'int cafe\u0301total = 42;',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier accepts structural requirements across harmless formatting', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'structural', value: 'int total = 42;' }] },
    'int   total\n = 42 ;',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('verifier does not count an expected output string in an unused variable', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'var message = "Zenith ready"; Console.WriteLine("other");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier does not count expected output text from a comment before a real output call', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    '// Console.WriteLine("Zenith ready");\nConsole.WriteLine("other");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier accepts expected output from a later output statement', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'Console.WriteLine("other");\nConsole.WriteLine("Zenith ready");',
  )
  assert.deepEqual(result.passedChecks, [true])
  assert.equal(result.complete, true)
})

test('verifier rejects output text that exists only in a different statement', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'Console.WriteLine("other");\nvar message = "Zenith ready";',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier does not mistake a lookalike C# namespace for System.Console', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'Fake.System.Console.WriteLine("Zenith ready");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier does not mistake a member named Console for the supported console API', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'output', value: 'Zenith ready' }] },
    'obj.Console.WriteLine("Zenith ready");',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier ignores quoted requirements embedded inside another quoted literal', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    { checks: [{ kind: 'quoted', value: 'Console.WriteLine("' }] },
    'var text = "Console.WriteLine(\\"Zenith ready\\");";',
  )
  assert.deepEqual(result.passedChecks, [false])
  assert.equal(result.complete, false)
})

test('verifier reports the first failed assertion while preserving later passing assertions', async () => {
  const verifyLessonCode = await loadVerifier()
  const result = verifyLessonCode(
    {
      checks: [
        { kind: 'structural', value: 'class Zenith' },
        { kind: 'output', value: 'ready' },
        { kind: 'structural', value: 'int score' },
      ],
    },
    'class Zenith {}\nConsole.WriteLine("ready");\nstring score = "ok";',
  )
  assert.deepEqual(result.passedChecks, [true, true, false])
  assert.equal(result.passedCount, 2)
  assert.equal(result.failedIndex, 2)
  assert.equal(result.complete, false)
})
