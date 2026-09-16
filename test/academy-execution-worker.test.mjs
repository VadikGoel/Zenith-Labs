import assert from 'node:assert/strict'
import test from 'node:test'
import { executeAcademySubmission } from '../lib/academy-execution-worker.ts'
import { tracks } from '../lib/academy-data.ts'

const csharpHello = tracks.find((track) => track.id === 'csharp').modules[0].lessons.find((lesson) => lesson.id === 'cs-hello')
const cppHello = tracks.find((track) => track.id === 'cpp').modules[0].lessons.find((lesson) => lesson.id === 'cpp-hello')

assert.ok(csharpHello)
assert.ok(cppHello)

function executionDiagnostics(result) {
  return JSON.stringify({
    status: result.status,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    truncated: result.truncated,
    reason: result.reason,
  })
}

test('worker rejects submissions before spawning a compiler when admission fails', async () => {
  const result = await executeAcademySubmission('csharp', '   ', csharpHello)
  assert.equal(result.status, 'rejected')
  assert.equal(result.exitCode, null)
  assert.match(result.reason ?? '', /empty/i)
})

test('worker compiles and runs a C++ submission inside a temporary workspace', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    '#include <iostream>\nint main() { std::cout << "Zenith Systems Online" << "\\n"; }',
    cppHello,
  )
  assert.equal(result.status, 'passed', executionDiagnostics(result))
  assert.equal(result.exitCode, 0, executionDiagnostics(result))
  assert.equal(result.stdout.trim(), 'Zenith Systems Online')
})

test('worker preserves and verifies multiline C++ output exactly', async () => {
  const multilineLesson = { ...cppHello, successOutput: ['Zenith', 'Systems', 'Online'] }
  const result = await executeAcademySubmission(
    'cpp',
    '#include <iostream>\nint main() { std::cout << "Zenith" << "\\n" << "Systems" << "\\n" << "Online" << "\\n"; }',
    multilineLesson,
  )
  assert.equal(result.status, 'passed', executionDiagnostics(result))
  assert.equal(result.exitCode, 0, executionDiagnostics(result))
  assert.equal(result.stdout, 'Zenith\nSystems\nOnline\n')
})

test('worker verifies chained C++ stream output without changing its ordering', async () => {
  const chainedLesson = { ...cppHello, successOutput: ['Zenith Systems', 'Online'] }
  const result = await executeAcademySubmission(
    'cpp',
    '#include <iostream>\nint main() { std::cout << "Zenith" << " " << "Systems" << "\\n" << "Online" << std::endl; }',
    chainedLesson,
  )
  assert.equal(result.status, 'passed', executionDiagnostics(result))
  assert.equal(result.exitCode, 0, executionDiagnostics(result))
  assert.equal(result.stdout, 'Zenith Systems\nOnline\n')
})

test('worker compiles and runs a C# submission inside a temporary workspace', async () => {
  const result = await executeAcademySubmission(
    'csharp',
    'using System;\nclass Program { static void Main() { Console.WriteLine("Hello, Zenith"); } }',
    csharpHello,
  )
  assert.equal(result.status, 'passed', executionDiagnostics(result))
  assert.equal(result.exitCode, 0, executionDiagnostics(result))
  assert.equal(result.stdout.trim(), 'Hello, Zenith')
})

test('worker reports output mismatches as failed without claiming success', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    '#include <iostream>\nint main() { std::cout << "Wrong output" << "\\n"; }',
    cppHello,
  )
  assert.equal(result.status, 'failed')
  assert.equal(result.exitCode, 0)
  assert.equal(result.stdout.trim(), 'Wrong output')
  assert.equal(result.truncated, false)
})

test('worker reports compiler failures as failed with diagnostics', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    'int main( { return 0; }',
    cppHello,
  )
  assert.equal(result.status, 'failed')
  assert.notEqual(result.exitCode, null)
  assert.notEqual(result.stderr.trim(), '')
})

test('worker reports a timed-out program instead of waiting indefinitely', async () => {
  const result = await executeAcademySubmission(
    'cpp',
    'int main() { for (;;) {} }',
    cppHello,
    { maxCodeBytes: 32 * 1024, maxOutputBytes: 8 * 1024, timeoutMs: 250, compileTimeoutMs: 15_000 },
  )
  assert.equal(result.status, 'timed_out')
  assert.match(result.reason ?? '', /250ms/)
})

test('worker kills the entire child process group when a program forks', { skip: process.platform === 'win32' }, async () => {
  const result = await executeAcademySubmission(
    'cpp',
    '#include <unistd.h>\nint main() { if (fork() == 0) { sleep(1); write(1, "CHILD_SURVIVED\\n", 15); return 0; } for (;;) {} }',
    cppHello,
    { maxCodeBytes: 32 * 1024, maxOutputBytes: 8 * 1024, timeoutMs: 500, compileTimeoutMs: 15_000 },
  )
  assert.equal(result.status, 'timed_out', `${result.stderr}\n${result.stdout}`)
  assert.doesNotMatch(result.stdout, /CHILD_SURVIVED/)
})
