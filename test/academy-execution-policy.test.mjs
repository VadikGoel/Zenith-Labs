import test from 'node:test'
import assert from 'node:assert/strict'
import { admitAcademyExecution, truncateExecutionOutput, ACADEMY_EXECUTION_POLICY } from '../lib/academy-execution-policy.ts'

const lesson = {
  id: 'policy-fixture',
  title: 'Execution policy fixture',
  points: 10,
  instructions: ['Write executable code.'],
  starterCode: 'Console.WriteLine("Hello");',
  checks: [{ kind: 'output', value: 'Hello' }],
}

function request(overrides = {}) {
  return { language: 'csharp', code: 'Console.WriteLine("Hello");', lesson, ...overrides }
}

test('execution admission allows supported lessons within policy limits', () => {
  const result = admitAcademyExecution(request())
  assert.equal(result.allowed, true)
  if (result.allowed) assert.deepEqual(result.policy, ACADEMY_EXECUTION_POLICY)
})

test('execution admission rejects empty or contractless submissions', () => {
  assert.equal(admitAcademyExecution(request({ code: '   ' })).allowed, false)
  assert.equal(admitAcademyExecution(request({ lesson: { ...lesson, checks: [] } })).allowed, false)
})

test('execution admission rejects unsupported languages', () => {
  assert.equal(admitAcademyExecution(request({ language: 'python' })).allowed, false)
})

test('execution admission rejects code over the byte limit', () => {
  const code = 'x'.repeat(ACADEMY_EXECUTION_POLICY.maxCodeBytes + 1)
  const result = admitAcademyExecution(request({ code }))
  assert.equal(result.allowed, false)
  if (!result.allowed) assert.match(result.reason, /byte code limit/)
})

test('execution admission rejects invalid runtime policy values', () => {
  assert.equal(admitAcademyExecution(request(), { ...ACADEMY_EXECUTION_POLICY, timeoutMs: 0 }).allowed, false)
  assert.equal(admitAcademyExecution(request(), { ...ACADEMY_EXECUTION_POLICY, maxOutputBytes: 0 }).allowed, false)
})

test('execution output is bounded by UTF-8 bytes without splitting a code point', () => {
  const result = truncateExecutionOutput('a'.repeat(10) + '🙂', 11)
  assert.equal(result.truncated, true)
  assert.equal(new TextEncoder().encode(result.output).byteLength, 10)
})

test('execution output preserves complete multibyte characters at the byte boundary', () => {
  const output = 'A🙂é漢B'
  const bytes = new TextEncoder().encode(output)
  for (const limit of [2, 5, 7, 10, bytes.byteLength - 1]) {
    const result = truncateExecutionOutput(output, limit)
    assert.equal(result.truncated, true)
    assert.equal(new TextDecoder('utf-8', { fatal: true }).decode(new TextEncoder().encode(result.output)), result.output)
    assert.ok(new TextEncoder().encode(result.output).byteLength <= limit)
    assert.ok(output.startsWith(result.output))
  }
})

test('execution output remains unchanged when under the limit', () => {
  const result = truncateExecutionOutput('Hello', 100)
  assert.deepEqual(result, { output: 'Hello', truncated: false })
})
