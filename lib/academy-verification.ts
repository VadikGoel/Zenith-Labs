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
      } else if (current === '\n') result += current
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
    } else result += current
  }
  return result
}

/** Mask literal contents so structural checks cannot match text inside literals. */
function maskLiteralContents(code: string): string {
  let result = ''
  let quote: '"' | "'" | null = null
  let escaped = false
  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]
    if (quote) {
      if (escaped) { escaped = false; result += ' ' }
      else if (current === '\\') { escaped = true; result += ' ' }
      else if (current === quote) { quote = null; result += current }
      else if (current === '\n') result += current
      else result += ' '
      continue
    }
    if (current === '"' || current === "'") { quote = current; result += current }
    else result += current
  }
  return result
}

/** Deterministic verifier used until the Academy gains compiler-backed execution. */
export function verifyLessonCode(lesson: Lesson, code: string): VerificationResult {
  if (lesson.checks.length === 0) {
    return { passedChecks: [], passedCount: 0, complete: false, failedIndex: 0 }
  }

  const executableCode = stripComments(code)
  const structuralCode = maskLiteralContents(executableCode)
  const passedChecks = lesson.checks.map((check) => {
    const requirement = check.trim()
    const executableMatch = requirement.length > 0 && executableCode.includes(requirement)
    const source = requirement.includes('"') || requirement.includes("'")
      ? executableCode
      : structuralCode
    return executableMatch && source.includes(requirement)
  })
  const failedIndex = passedChecks.findIndex((passed) => !passed)
  return {
    passedChecks,
    passedCount: passedChecks.filter(Boolean).length,
    complete: failedIndex === -1,
    failedIndex,
  }
}
