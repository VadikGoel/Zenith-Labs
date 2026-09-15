import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
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
  options: { cwd: string; timeoutMs: number; maxOutputBytes: number },
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
      if (process.platform === 'win32') {
        child.kill('SIGKILL')
      } else if (child.pid) {
        process.kill(-child.pid, 'SIGKILL')
      }
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

async function runBoundedCommand(
  file: string,
  args: string[],
  options: { cwd: string; timeoutMs: number; maxOutputBytes: number },
) {
  try {
    return await runWithProcessGroup(file, args, options)
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    return {
      stdout: '',
      stderr: err.message,
      exitCode: typeof err.code === 'number' ? err.code : null,
      timedOut: false,
      truncated: false,
    }
  }
}

function failedCommandResult(command: CommandResult, policy: AcademyExecutionPolicy, started: number): AcademyExecutionResult | null {
  if (command.timedOut) {
    return {
      status: 'timed_out',
      stdout: truncateExecutionOutput(command.stdout, policy.maxOutputBytes).output,
      stderr: truncateExecutionOutput(command.stderr, policy.maxOutputBytes).output,
      exitCode: command.exitCode,
      truncated: command.truncated,
      durationMs: Date.now() - started,
      reason: `Execution exceeded ${policy.timeoutMs}ms.`,
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

  let root = ''
  try {
    root = await mkdtemp(join(tmpdir(), 'zenith-academy-'))
    let runFile = ''
    let runArgs: string[] = []

    if (language === 'cpp') {
      const source = join(root, 'main.cpp')
      const binary = join(root, 'app')
      await writeFile(source, code, 'utf8')
      const compile = await runBoundedCommand('g++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', source, '-o', binary], {
        cwd: root,
        timeoutMs: policy.timeoutMs,
        maxOutputBytes: policy.maxOutputBytes,
      })
      const compileFailure = failedCommandResult(compile, policy, started)
      if (compileFailure) return compileFailure
      runFile = binary
    } else {
      const setup = await runBoundedCommand('dotnet', ['new', 'console', '--framework', 'net10.0', '--force', '--output', root], {
        cwd: root,
        timeoutMs: policy.timeoutMs,
        maxOutputBytes: policy.maxOutputBytes,
      })
      const setupFailure = failedCommandResult(setup, policy, started)
      if (setupFailure) return setupFailure
      await writeFile(join(root, 'Program.cs'), code, 'utf8')
      runFile = 'dotnet'
      runArgs = ['run', '--no-restore', '--project', join(root, 'AcademyRunner.csproj')]
    }

    const run = await runWithProcessGroup(runFile, runArgs, {
      cwd: root,
      timeoutMs: policy.timeoutMs,
      maxOutputBytes: policy.maxOutputBytes,
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
    const err = error as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean }
    const stdout = truncateExecutionOutput(String(err.stdout ?? ''), policy.maxOutputBytes)
    const stderr = truncateExecutionOutput(String(err.stderr ?? ''), policy.maxOutputBytes)
    const timedOut = Boolean(err.killed)
    return {
      status: timedOut ? 'timed_out' : 'failed',
      stdout: stdout.output,
      stderr: stderr.output,
      exitCode: typeof err.code === 'number' ? err.code : null,
      truncated: stdout.truncated || stderr.truncated,
      durationMs: Date.now() - started,
      reason: timedOut ? `Execution exceeded ${policy.timeoutMs}ms.` : undefined,
    }
  } finally {
    if (root) await rm(root, { recursive: true, force: true })
  }
}
