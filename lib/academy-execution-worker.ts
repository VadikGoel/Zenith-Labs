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

function commandFor(language: AcademyExecutionLanguage, root: string) {
  if (language === 'cpp') {
    return {
      file: 'g++',
      args: ['-std=c++20', '-Wall', '-Wextra', '-Werror', join(root, 'main.cpp'), '-o', join(root, 'app')],
      run: { file: join(root, 'app'), args: [] as string[] },
    }
  }
  return {
    file: 'dotnet',
    args: ['new', 'console', '--framework', 'net10.0', '--force', '--no-restore', '--output', root],
    run: { file: 'dotnet', args: ['run', '--no-restore', '--project', join(root, 'AcademyRunner.csproj')] },
  }
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
    const command = commandFor(language, root)

    if (language === 'cpp') {
      await writeFile(join(root, 'main.cpp'), code, 'utf8')
      await execFileAsync(command.file, command.args, { cwd: root, timeout: policy.timeoutMs, maxBuffer: policy.maxOutputBytes })
    } else {
      await execFileAsync(command.file, command.args, { cwd: root, timeout: policy.timeoutMs, maxBuffer: policy.maxOutputBytes })
      await writeFile(join(root, 'Program.cs'), code, 'utf8')
      await execFileAsync(command.run.file, command.run.args, { cwd: root, timeout: policy.timeoutMs, maxBuffer: policy.maxOutputBytes })
    }

    const run = await execFileAsync(command.run.file, command.run.args, { cwd: root, timeout: policy.timeoutMs, maxBuffer: policy.maxOutputBytes })
    const bounded = truncateExecutionOutput(run.stdout, policy.maxOutputBytes)
    const expected = expectedOutput(lesson)
    return {
      status: bounded.output.trim() === expected ? 'passed' : 'failed',
      stdout: bounded.output,
      stderr: run.stderr,
      exitCode: 0,
      truncated: bounded.truncated,
      durationMs: Date.now() - started,
    }
  } catch (error) {
    const timedOut = typeof error === 'object' && error !== null && 'killed' in error && Boolean(error.killed)
    const err = error as { stdout?: string; stderr?: string; code?: number | string; killed?: boolean }
    const stdout = truncateExecutionOutput(err.stdout ?? '', policy.maxOutputBytes)
    const stderr = truncateExecutionOutput(err.stderr ?? '', policy.maxOutputBytes)
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
