import type { Lesson } from '@/lib/academy-data'

export type VerificationResult = {
  passedChecks: boolean[]
  passedCount: number
  complete: boolean
  failedIndex: number
}

/**
 * Deterministic placeholder verifier used until the Academy gains compiler-backed
 * execution. Keeping this logic outside the UI makes the verification contract
 * independently testable and replaceable without changing the workspace.
 */
export function verifyLessonCode(lesson: Lesson, code: string): VerificationResult {
  const passedChecks = lesson.checks.map((check) => code.includes(check))
  const passedCount = passedChecks.filter(Boolean).length
  const failedIndex = passedChecks.findIndex((passed) => !passed)

  return {
    passedChecks,
    passedCount,
    complete: failedIndex === -1,
    failedIndex,
  }
}
