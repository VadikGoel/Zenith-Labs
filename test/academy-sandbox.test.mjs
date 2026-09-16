import assert from 'node:assert/strict'
import test from 'node:test'
import { ACADEMY_SANDBOX, buildSandboxArgs, sandboxSecurityContract } from '../lib/academy-sandbox.ts'

const policy = { maxCodeBytes: 32 * 1024, maxOutputBytes: 8 * 1024, timeoutMs: 3_000, compileTimeoutMs: 60_000 }

test('sandbox uses an immutable C++ image and explicit isolation controls', () => {
  const compile = buildSandboxArgs('cpp', 'compile', '/tmp/zenith-academy-test', policy)
  assert.match(ACADEMY_SANDBOX.cppImage, /^gcc:14\.4\.0@sha256:[0-9a-f]{64}$/)
  assert.equal(compile[0], 'run')
  assert.ok(compile.includes('--network') && compile.includes('none'))
  assert.ok(compile.includes('--read-only'))
  assert.ok(compile.includes('--cap-drop') && compile.includes('ALL'))
  assert.ok(compile.includes('--security-opt') && compile.includes('no-new-privileges=true'))
  assert.ok(compile.includes('--memory') && compile.includes('128m'))
  assert.ok(compile.includes('--cpus') && compile.includes('0.5'))
  assert.ok(compile.includes('--pids-limit') && compile.includes('64'))
  assert.ok(compile.includes('--user') && compile.includes('65532:65532'))
  assert.ok(compile.includes(`type=bind,src=/tmp/zenith-academy-test/input,dst=/input,readonly`))
  assert.ok(compile.includes(`type=bind,src=/tmp/zenith-academy-test/output,dst=/output`))
  assert.equal(compile.at(-1), '/output/app')

  const run = buildSandboxArgs('cpp', 'run', '/tmp/zenith-academy-test', policy)
  const outputMount = run.find((value) => value.includes('dst=/output'))
  assert.match(outputMount ?? '', /readonly/)
  assert.equal(run.at(-1), '/output/app')
})

test('sandbox uses the pinned .NET build image and isolated C# compiler state', () => {
  const compile = buildSandboxArgs('csharp', 'compile', '/tmp/zenith-academy-test', policy)
  assert.match(ACADEMY_SANDBOX.csharpImage, /^mcr\.microsoft\.com\/dotnet\/sdk:[^@]+@sha256:[0-9a-f]{64}$/)
  assert.match(ACADEMY_SANDBOX.csharpRuntimeImage, /^mcr\.microsoft\.com\/dotnet\/runtime:[^@]+@sha256:[0-9a-f]{64}$/)
  assert.ok(compile.some((value) => value === ACADEMY_SANDBOX.csharpImage))
  assert.ok(compile.includes('--network') && compile.includes('none'))
  assert.ok(compile.includes('--read-only'))
  assert.ok(compile.includes('--cap-drop') && compile.includes('ALL'))
  assert.ok(compile.includes('--security-opt') && compile.includes('no-new-privileges=true'))
  assert.ok(compile.includes('--user') && compile.includes('65532:65532'))
  assert.ok(compile.includes('--env') && compile.includes('DOTNET_CLI_HOME=/tmp/dotnet-home'))
  assert.ok(compile.includes('--env') && compile.includes('NUGET_PACKAGES=/tmp/nuget'))
  assert.ok(compile.includes('--env') && compile.includes('DOTNET_SKIP_WORKLOAD_INTEGRITY_CHECK=true'))
  assert.ok(compile.includes('-p:MSBuildEnableWorkloadResolver=false'))
  assert.ok(compile.includes('-o'))
  assert.ok(compile.includes('/output'))

  const run = buildSandboxArgs('csharp', 'run', '/tmp/zenith-academy-test', policy)
  const outputMount = run.find((value) => value.includes('dst=/output'))
  assert.ok(run.some((value) => value === ACADEMY_SANDBOX.csharpRuntimeImage))
  assert.ok(!run.some((value) => value === ACADEMY_SANDBOX.csharpImage))
  assert.match(outputMount ?? '', /readonly/)
  assert.equal(run.at(-1), '/output/AcademyRunner.dll')
  assert.ok(!run.includes('dotnet'))
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
