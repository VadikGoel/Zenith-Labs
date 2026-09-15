import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile, chmod } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Lesson } from './academy-data.ts'
import {
  ACADEMY_EXECUTION_POLICY,
  admitAcademyExecution,
  truncateExecutionOutput,
  type AcademyExecutionLanguage,
  type AcademyExecutionPolicy,
} from './academy-execution-policy.ts'
import { buildSandboxArgs, sandboxAvailable } from './academy-sandbox.ts'

export type AcademyExecutionResult = {
  status: 'passed' | 'failed' | 'rejected' | 'timed_out'
  stdout: string
  stderr: string
  exitCode: number | null
  truncated: boolean
  durationMs: number
  reason?: string
}

type CommandResult = {
  stdout: string
  stderr: string
  exitCode: number | null
  timedOut: boolean
  truncated: boolean
}

function expectedOutput(lesson: Lesson) {
  return lesson.successOutput
    .filter((line) => !line.startsWith('VERIFICATION PASSED'))
    .join('\n')
    .trim()
}

function runWithProcessGroup(
  file: string,
  args: string[],
  options: { cwd: string; timeoutMs: number; maxOutputBytes: number; timeoutCleanup?: () => void },
) {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(file, args, {
      cwd: options.cwd,
      shell: false,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let truncated = false
    let timedOut = false
    let settled = false
    let timer: NodeJS.Timeout | undefined

    const append = (target: 'stdout' | 'stderr', chunk: Buffer) => {
      const current = target === 'stdout' ? stdout : stderr
      const next = Buffer.concat([Buffer.from(current), chunk])
      if (next.byteLength > options.maxOutputBytes) {
        truncated = true
        const bounded = next.subarray(0, options.maxOutputBytes).toString('utf8')
        if (target === 'stdout') stdout = bounded
        else stderr = bounded
      } else if (target === 'stdout') stdout = next.toString('utf8')
      else stderr = next.toString('utf8')
    }

    const kill = () => {
      if (process.platform === 'win32') child.kill('SIGKILL')
      else if (child.pid) process.kill(-child.pid, 'SIGKILL')
      options.timeoutCleanup?.()
    }

    const finish = (exitCode: number | null) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      resolve({ stdout, stderr, exitCode, timedOut, truncated })
    }

    child.stdout.on('data', (chunk: Buffer) => append('stdout', chunk))
    child.stderr.on('data', (chunk: Buffer) => append('stderr', chunk))
    child.once('error', (error) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      reject(error)
    })
    child.once('close', (exitCode) => finish(exitCode))

    timer = setTimeout(() => {
      timedOut = true
      kill()
    }, options.timeoutMs)
  })
}

async function runBoundedDocker(
  args: string[],
  options: { cwd: string; timeoutMs: number; maxOutputBytes: number; containerName: string },
) {
  return runWithProcessGroup('docker', args, {
    ...options,
    timeoutCleanup: () => {
      spawn('docker', ['rm', '--force', options.containerName], { stdio: 'ignore', shell: false })
    },
  })
}

function failedCommandResult(command: CommandResult, policy: AcademyExecutionPolicy, started: number, timeoutMs: number, phase: 'compile' | 'run'): AcademyExecutionResult | null {
  if (command.timedOut) {
    return {
      status: 'timed_out',
      stdout: truncateExecutionOutput(command.stdout, policy.maxOutputBytes).output,
      stderr: truncateExecutionOutput(command.stderr, policy.maxOutputBytes).output,
      exitCode: command.exitCode,
      truncated: command.truncated,
      durationMs: Date.now() - started,
      reason: `${phase === 'compile' ? 'Compilation' : 'Execution'} exceeded ${timeoutMs}ms.`,
    }
  }
  if (command.exitCode !== 0) {
    const stdout = truncateExecutionOutput(command.stdout, policy.maxOutputBytes)
    const stderr = truncateExecutionOutput(command.stderr, policy.maxOutputBytes)
    return {
      status: 'failed',
      stdout: stdout.output,
      stderr: stderr.output,
      exitCode: command.exitCode,
      truncated: command.truncated || stdout.truncated || stderr.truncated,
      durationMs: Date.now() - started,
    }
  }
  return null
}

function containerName(root: string, phase: string) {
  return `zenith-academy-${root.split('/').pop()?.replace(/[^a-zA-Z0-9_.-]/g, '-')}-${phase}`
}

function sandboxArgs(
  language: AcademyExecutionLanguage,
  phase: 'compile' | 'run',
  root: string,
  policy: AcademyExecutionPolicy,
  name: string,
) {
  const args = buildSandboxArgs(language, phase, root, policy)
  return [args[0], '--name', name, ...args.slice(1)]
}

export async function executeAcademySubmission(
  language: AcademyExecutionLanguage,
  code: string,
  lesson: Lesson,
  policy: AcademyExecutionPolicy = ACADEMY_EXECUTION_POLICY,
): Promise<AcademyExecutionResult> {
  const started = Date.now()
  const admission = admitAcademyExecution({ language, code, lesson }, policy)
  if (!admission.allowed) {
    return { status: 'rejected', stdout: '', stderr: '', exitCode: null, truncated: false, durationMs: Date.now() - started, reason: admission.reason }
  }
  if (!sandboxAvailable()) {
    return { status: 'rejected', stdout: '', stderr: '', exitCode: null, truncated: false, durationMs: Date.now() - started, reason: 'The Academy sandbox requires a Linux container runtime.' }
  }

  let root = ''
  try {
    root = await mkdtemp(join(tmpdir(), 'zenith-academy-'))
    await mkdir(join(root, 'input'))
    await mkdir(join(root, 'output'))
    await chmod(join(root, 'output'), 0o777)

    if (language === 'cpp') {
      await writeFile(join(root, 'input', 'main.cpp'), code, 'utf8')
    } else {
      await writeFile(join(root, 'input', 'Program.cs'), code, 'utf8')
      await writeFile(join(root, 'input', 'AcademyRunner.csproj'), '<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable></PropertyGroup></Project>', 'utf8')
    }

    const compileName = containerName(root, 'compile')
    const compile = await runBoundedDocker(sandboxArgs(language, 'compile', root, policy, compileName), {
      cwd: root,
      timeoutMs: policy.compileTimeoutMs,
      maxOutputBytes: policy.maxOutputBytes,
      containerName: compileName,
    })
    const compileFailure = failedCommandResult(compile, policy, started, policy.compileTimeoutMs, 'compile')
    if (compileFailure) return compileFailure

    const runName = containerName(root, 'run')
    const run = await runBoundedDocker(sandboxArgs(language, 'run', root, policy, runName), {
      cwd: root,
      timeoutMs: policy.timeoutMs,
      maxOutputBytes: policy.maxOutputBytes,
      containerName: runName,
    })
    const stdout = truncateExecutionOutput(run.stdout, policy.maxOutputBytes)
    const stderr = truncateExecutionOutput(run.stderr, policy.maxOutputBytes)
    const expected = expectedOutput(lesson)

    return {
      status: run.timedOut ? 'timed_out' : (!stdout.truncated && run.exitCode === 0 && stdout.output.trim() === expected ? 'passed' : 'failed'),
      stdout: stdout.output,
      stderr: stderr.output,
      exitCode: run.exitCode,
      truncated: run.truncated || stdout.truncated || stderr.truncated,
      durationMs: Date.now() - started,
      reason: run.timedOut ? `Execution exceeded ${policy.timeoutMs}ms.` : undefined,
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    const stderr = truncateExecutionOutput(err.message ?? 'Sandbox execution failed.', policy.maxOutputBytes)
    return {
      status: 'failed',
      stdout: '',
      stderr: stderr.output,
      exitCode: typeof err.code === 'number' ? err.code : null,
      truncated: stderr.truncated,
      durationMs: Date.now() - started,
    }
  } finally {
    if (root) await rm(root, { recursive: true, force: true })
  }
}
