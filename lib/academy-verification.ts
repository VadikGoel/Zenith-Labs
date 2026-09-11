import type { Lesson } from '@/lib/academy-data'

export type VerificationResult = {
  passedChecks: boolean[]
  passedCount: number
  complete: boolean
  failedIndex: number
}

/** Remove comments without touching quoted string or character literals. */
function stripComments(code: string): string {
  let result = ''
  let quote: '"' | "'" | null = null
  let escaped = false
  let blockComment = false
  let lineComment = false

  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]
    const next = code[i + 1]

    if (lineComment) {
      if (current === '\n') {
        lineComment = false
        result += current
      }
      continue
    }

    if (blockComment) {
      if (current === '*' && next === '/') {
        blockComment = false
        i += 1
        result += ' '
      } else if (current === '\n') {
        result += current
      }
      continue
    }

    if (quote) {
      result += current
      if (escaped) escaped = false
      else if (current === '\\') escaped = true
      else if (current === quote) quote = null
      continue
    }

    if (current === '"' || current === "'") {
      quote = current
      result += current
    } else if (current === '/' && next === '/') {
      lineComment = true
      i += 1
      result += ' '
    } else if (current === '/' && next === '*') {
      blockComment = true
      i += 1
      result += ' '
    } else {
      result += current
    }
  }

  return result
}

/** Mask string/character literal contents so structural checks cannot match inside literals. */
function maskLiteralContents(code: string): string {
  let result = ''
  let quote: '"' | "'" | null = null
  let escaped = false

  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]

    if (quote) {
      if (escaped) {
        escaped = false
        result += ' '
      } else if (current === '\\') {
        escaped = true
        result += ' '
      } else if (current === quote) {
        quote = null
        result += current
      } else if (current === '\n') {
        result += current
      } else {
        result += ' '
      }
      continue
    }

    if (current === '"' || current === "'") {
      quote = current
      result += current
    } else {
      result += current
    }
  }

  return result
}

/**
 * Deterministic placeholder verifier used until the Academy gains compiler-backed
 * execution. Keeping this logic outside the UI makes the verification contract
 * independently testable and replaceable without changing the workspace.
 */
export function verifyLessonCode(lesson: Lesson, code: string): VerificationResult {
  const executableCode = stripComments(code)
  const structuralCode = maskLiteralContents(executableCode)
  const passedChecks = lesson.checks.map((check) => {
    const requirement = check.trim()
    const executableMatch = requirement.length > 0 && executableCode.includes(requirement)

    const source = requirement.includes('"') || requirement.includes("'")
      ? executableCode
      : structuralCode

    return executableMatch || source.includes(requirement)
  })
  const failedIndex = passedChecks.findIndex((passed) => !passed)

  return {
    passedChecks,
    passedCount: passedChecks.filter(Boolean).length,
    complete: failedIndex === -1,
    failedIndex: passedChecks.findIndex((passed) => !passed),
  }
}
