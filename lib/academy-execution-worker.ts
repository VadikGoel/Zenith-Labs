import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { Lesson } from './academy-data.ts'
import {
  ACADEMY_EXECUTION_POLICY,
  admitAcademyExecution,
  truncateExecutionOutput,
  type AcademyExecutionLanguage,
  type AcademyExecutionPolicy,
} from './academy-execution-policy.ts'

const execFileAsync = promisify(execFile)

export type AcademyExecutionResult = {
  status: 'passed' | 'failed' | 'rejected' | 'timed_out'
  stdout: string
  stderr: string
  exitCode: number | null
  truncated: boolean
  durationMs: number
  reason?: string
}

function expectedOutput(lesson: Lesson) {
  return lesson.successOutput
    .filter((line) => !line.startsWith('VERIFICATION PASSED'))
    .join('\n')
    .trim()
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
      await execFileAsync('g++', ['-std=c++20', '-Wall', '-Wextra', '-Werror', source, '-o', binary], {
        cwd: root,
        timeout: policy.timeoutMs,
        maxBuffer: policy.maxOutputBytes,
        shell: false,
      })
      runFile = binary
    } else {
      await execFileAsync('dotnet', ['new', 'console', '--framework', 'net10.0', '--force', '--output', root], {
        cwd: root,
        timeout: policy.timeoutMs,
        maxBuffer: policy.maxOutputBytes,
        shell: false,
      })
      await writeFile(join(root, 'Program.cs'), code, 'utf8')
      runFile = 'dotnet'
      runArgs = ['run', '--no-restore', '--project', join(root, 'AcademyRunner.csproj')]
    }

    const run = await execFileAsync(runFile, runArgs, {
      cwd: root,
      timeout: policy.timeoutMs,
      maxBuffer: policy.maxOutputBytes,
      shell: false,
    })
    const stdout = truncateExecutionOutput(String(run.stdout ?? ''), policy.maxOutputBytes)
    const stderr = truncateExecutionOutput(String(run.stderr ?? ''), policy.maxOutputBytes)
    const expected = expectedOutput(lesson)

    return {
      status: !stdout.truncated && stdout.output.trim() === expected ? 'passed' : 'failed',
      stdout: stdout.output,
      stderr: stderr.output,
      exitCode: 0,
      truncated: stdout.truncated || stderr.truncated,
      durationMs: Date.now() - started,
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
