import assert from 'node:assert/strict'
import test from 'node:test'
import { ACADEMY_SANDBOX, buildSandboxArgs, sandboxSecurityContract } from '../lib/academy-sandbox.ts'

const policy = { maxCodeBytes: 32 * 1024, maxOutputBytes: 8 * 1024, timeoutMs: 3_000 }

test('sandbox uses explicit isolation controls for C++ compile and run', () => {
  const compile = buildSandboxArgs('cpp', 'compile', '/tmp/zenith-academy-test', policy)
  assert.equal(compile[0], 'run')
  assert.ok(compile.includes('--network') && compile.includes('none'))
  assert.ok(compile.includes('--read-only'))
  assert.ok(compile.includes('--cap-drop') && compile.includes('ALL'))
  assert.ok(compile.includes('--security-opt') && compile.includes('no-new-privileges=true'))
  assert.ok(compile.includes('--memory') && compile.includes('128m'))
  assert.ok(compile.includes('--cpus') && compile.includes('0.5'))
  assert.ok(compile.includes('--pids-limit') && compile.includes('64'))
  assert.ok(compile.includes('--user') && compile.includes('65532:65532'))
  assert.equal(compile.at(-1), '/output/app')

  const run = buildSandboxArgs('cpp', 'run', '/tmp/zenith-academy-test', policy)
  const outputMount = run.find((value) => value.includes('dst=/output'))
  assert.match(outputMount ?? '', /readonly/)
  assert.equal(run.at(-1), '/output/app')
})

test('sandbox uses the pinned .NET image and bounded build output', () => {
  const args = buildSandboxArgs('csharp', 'compile', '/tmp/zenith-academy-test', policy)
  assert.ok(args.some((value) => value === ACADEMY_SANDBOX.csharpImage))
  assert.ok(args.includes('--network') && args.includes('none'))
  assert.ok(args.includes('--read-only'))
  assert.ok(args.includes('-o'))
  assert.ok(args.includes('/output'))
})

test('sandbox security contract exposes all enforced resource boundaries', () => {
  assert.deepEqual(sandboxSecurityContract(policy), {
    network: 'none',
    readOnlyRoot: true,
    droppedCapabilities: 'ALL',
    noNewPrivileges: true,
    memoryBytes: 128 * 1024 * 1024,
    cpuCores: 0.5,
    pids: 64,
    tmpfsBytes: 16 * 1024 * 1024,
    outputBytes: 8 * 1024,
    timeoutMs: 3_000,
  })
})
