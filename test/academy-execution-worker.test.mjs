import assert from 'node:assert/strict'
import test from 'node:test'
import { executeAcademySubmission } from '../lib/academy-execution-worker.ts'
import { tracks } from '../lib/academy-data.ts'

const csharpHello = tracks.find((track) => track.id === 'csharp').modules[0].lessons.find((lesson) => lesson.id === 'cs-hello')
const cppHello = tracks.find((track) => track.id === 'cpp').modules[0].lessons.find((lesson) => lesson.id === 'cpp-hello')

assert.ok(csharpHello)
assert.ok(cppHello)

test('worker rejects submissions before spawning a compiler when admission fails', async () => {
  const result = await executeAcademySubmission('csharp', '   ', csharpHello)
  assert.equal(result.status, 'rejected')
  assert.equal(result.exitCode, null)
  assert.match(result.reason ?? '', /empty/i)
})

test('worker compiles and runs a C++ submission inside a temporary workspace', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    '#include <iostream>\nint main() { std::cout << "Hello, Zenith" << "\\n"; }',
    cppHello,
  )
  assert.equal(result.status, 'passed', `${result.stderr}\n${result.stdout}`)
  assert.equal(result.stdout.trim(), 'Hello, Zenith')
})

test('worker compiles and runs a C# submission inside a temporary workspace', async () => {
  const result = await executeAcademySubmission(
    'csharp',
    'using System;\nclass Program { static void Main() { Console.WriteLine("Hello, Zenith"); } }',
    csharpHello,
  )
  assert.equal(result.status, 'passed', `${result.stderr}\n${result.stdout}`)
  assert.equal(result.stdout.trim(), 'Hello, Zenith')
})

test('worker reports a timed-out program instead of waiting indefinitely', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    'int main() { for (;;) {} }',
    cppHello,
    { maxCodeBytes: 32 * 1024, maxOutputBytes: 8 * 1024, timeoutMs: 100 },
  )
  assert.equal(result.status, 'timed_out')
  assert.match(result.reason ?? '', /100ms/)
})
