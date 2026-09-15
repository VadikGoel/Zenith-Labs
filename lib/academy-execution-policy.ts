import type { Lesson } from './academy-data.ts'

export type AcademyExecutionLanguage = 'csharp' | 'cpp'

export type AcademyExecutionRequest = {
  language: AcademyExecutionLanguage
  code: string
  lesson: Lesson
}

export type AcademyExecutionPolicy = {
  maxCodeBytes: number
  maxOutputBytes: number
  timeoutMs: number
}

export const ACADEMY_EXECUTION_POLICY: AcademyExecutionPolicy = {
  maxCodeBytes: 32 * 1024,
  maxOutputBytes: 8 * 1024,
  timeoutMs: 3_000,
}

export type AcademyExecutionAdmission =
  | { allowed: true; request: AcademyExecutionRequest; policy: AcademyExecutionPolicy }
  | { allowed: false; reason: string }

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength
}

export function admitAcademyExecution(
  request: AcademyExecutionRequest,
  policy: AcademyExecutionPolicy = ACADEMY_EXECUTION_POLICY,
): AcademyExecutionAdmission {
  if (!request.lesson || request.lesson.checks.length === 0) {
    return { allowed: false, reason: 'Lesson has no executable verification contract.' }
  }

  if (request.language !== 'csharp' && request.language !== 'cpp') {
    return { allowed: false, reason: 'Language is not supported by the Academy execution boundary.' }
  }

  if (typeof request.code !== 'string' || request.code.trim().length === 0) {
    return { allowed: false, reason: 'Submission is empty.' }
  }

  if (byteLength(request.code) > policy.maxCodeBytes) {
    return { allowed: false, reason: `Submission exceeds the ${policy.maxCodeBytes}-byte code limit.` }
  }

  if (!Number.isInteger(policy.timeoutMs) || policy.timeoutMs <= 0) {
    return { allowed: false, reason: 'Execution timeout policy is invalid.' }
  }

  if (!Number.isInteger(policy.maxOutputBytes) || policy.maxOutputBytes <= 0) {
    return { allowed: false, reason: 'Execution output policy is invalid.' }
  }

  return { allowed: true, request, policy }
}

export function truncateExecutionOutput(output: string, maxOutputBytes = ACADEMY_EXECUTION_POLICY.maxOutputBytes) {
  const bytes = new TextEncoder().encode(output)
  if (bytes.byteLength <= maxOutputBytes) return { output, truncated: false }

  const clipped = bytes.slice(0, maxOutputBytes)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return { output: decoder.decode(clipped), truncated: true }
}
