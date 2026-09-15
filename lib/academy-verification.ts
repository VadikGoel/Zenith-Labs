import type { Lesson } from './academy-data'
import { normalizeCheck } from './academy-checks.ts'

export type VerificationResult = {
  passedChecks: boolean[]
  passedCount: number
  complete: boolean
  failedIndex: number
}

type Quote = '"' | "'" | '`'

/** Remove comments without touching quoted string, character, or template literals. */
function stripComments(code: string): string {
  let result = ''
  let quote: Quote | null = null
  let verbatim = false
  let escaped = false
  let blockComment = false
  let lineComment = false

  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]
    const next = code[i + 1]
    const previous = i > 0 ? code[i - 1] : ''

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
      if (verbatim) {
        if (current === '"' && next === '"') {
          result += next
          i += 1
        } else if (current === '"') {
          quote = null
          verbatim = false
        }
      } else if (escaped) escaped = false
      else if (current === '\\') escaped = true
      else if (current === quote) quote = null
      continue
    }
    if (current === '"' || current === "'" || current === '`') {
      quote = current
      verbatim = current === '"' && previous === '@'
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
  let quote: Quote | null = null
  let verbatim = false
  let escaped = false
  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]
    const next = code[i + 1]
    const previous = i > 0 ? code[i - 1] : ''
    if (quote) {
      if (verbatim) {
        if (current === '"' && next === '"') {
          result += '  '
          i += 1
        } else if (current === '"') {
          quote = null
          verbatim = false
          result += current
        } else if (current === '\n') result += current
        else result += ' '
      } else if (escaped) { escaped = false; result += ' ' }
      else if (current === '\\') { escaped = true; result += ' ' }
      else if (current === quote) { quote = null; result += current }
      else if (current === '\n') result += current
      else result += ' '
      continue
    }
    if (current === '"' || current === "'" || current === '`') {
      quote = current
      verbatim = current === '"' && previous === '@'
      result += current
    }
    else result += current
  }
  return result
}

/** Normalize the common escape sequences used when source code prints text. */
function normalizeLiteralContent(value: string): string {
  return value
    .replace(/\\([\"'`\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
}

/** Normalize source formatting while preserving separation between identifiers. */
function normalizeStructuralSyntax(value: string): string {
  return value
    .replace(/\s+(?=[()[\]{}.,;=<>:+\-*/%!?&|])/g, '')
    .replace(/([()[\]{}.,;=<>:+\-*/%!?&|])\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Match a structural requirement without accepting a partial identifier match. */
function containsStructuralRequirement(code: string, requirement: string): boolean {
  const normalizedRequirement = normalizeStructuralSyntax(requirement)
  if (normalizedRequirement.length === 0) return false

  let searchFrom = 0
  while (searchFrom <= code.length - normalizedRequirement.length) {
    const index = code.indexOf(normalizedRequirement, searchFrom)
    if (index === -1) return false

    const before = index > 0 ? code[index - 1] : ''
    const afterIndex = index + normalizedRequirement.length
    const after = afterIndex < code.length ? code[afterIndex] : ''
    const isIdentifierChar = (value: string) => /[A-Za-z0-9_$]/.test(value)
    const startsWithIdentifier = isIdentifierChar(normalizedRequirement[0])
    const endsWithIdentifier = isIdentifierChar(normalizedRequirement.at(-1) ?? '')
    const startsInsideIdentifier = startsWithIdentifier && isIdentifierChar(before)
    const endsInsideIdentifier = endsWithIdentifier && isIdentifierChar(after)

    if (!startsInsideIdentifier && !endsInsideIdentifier) return true
    searchFrom = index + 1
  }

  return false
}

/** Match a human-readable output requirement inside a quoted literal. */
function containsLiteralContent(code: string, requirement: string): boolean {
  let quote: Quote | null = null
  let verbatim = false
  let escaped = false
  let literal = ''

  for (let i = 0; i < code.length; i += 1) {
    const current = code[i]
    const previous = i > 0 ? code[i - 1] : ''
    if (quote) {
      if (verbatim) {
        if (current === '"' && code[i + 1] === '"') {
          literal += '"'
          i += 1
        } else if (current === '"') {
          if (normalizeLiteralContent(literal).includes(requirement)) return true
          quote = null
          verbatim = false
          literal = ''
        } else {
          literal += current
        }
      } else if (escaped) {
        literal += current
        escaped = false
      } else if (current === '\\') {
        literal += current
        escaped = true
      } else if (current === quote) {
        if (normalizeLiteralContent(literal).includes(requirement)) return true
        quote = null
        literal = ''
      } else {
        literal += current
      }
      continue
    }
    if (current === '"' || current === "'" || current === '`') {
      quote = current
      verbatim = current === '"' && previous === '@'
      literal = ''
    }
  }

  return false
}

/** Return whether an index is inside a source literal. Comments have already been removed. */
function isInsideLiteral(code: string, index: number): boolean {
  let quote: Quote | null = null
  let verbatim = false
  let escaped = false

  for (let i = 0; i < index; i += 1) {
    const current = code[i]
    const next = code[i + 1]
    const previous = i > 0 ? code[i - 1] : ''
    if (quote) {
      if (verbatim) {
        if (current === '"' && next === '"') i += 1
        else if (current === '"') {
          quote = null
          verbatim = false
        }
      } else if (escaped) escaped = false
      else if (current === '\\') escaped = true
      else if (current === quote) quote = null
    } else if (current === '"' || current === "'" || current === '`') {
      quote = current
      verbatim = current === '"' && previous === '@'
    }
  }

  return quote !== null
}

/** Find the first semicolon that is outside a string, character, or template literal. */
function findStatementEnd(code: string, start: number): number {
  let quote: Quote | null = null
  let verbatim = false
  let escaped = false

  for (let i = start; i < code.length; i += 1) {
    const current = code[i]
    const next = code[i + 1]
    const previous = i > 0 ? code[i - 1] : ''
    if (quote) {
      if (verbatim) {
        if (current === '"' && next === '"') i += 1
        else if (current === '"') {
          quote = null
          verbatim = false
        }
      } else if (escaped) escaped = false
      else if (current === '\\') escaped = true
      else if (current === quote) quote = null
      continue
    }
    if (current === '"' || current === "'" || current === '`') {
      quote = current
      verbatim = current === '"' && previous === '@'
    } else if (current === ';') {
      return i
    }
  }

  return -1
}

/**
 * Match an output requirement only when the matching literal is part of a
 * recognized console/stream output expression. This avoids passing a check
 * merely because an unused string variable contains the expected text.
 */
function containsPrintedLiteralContent(code: string, requirement: string): boolean {
  const outputCall = /(?<![A-Za-z0-9_$.\:])(?:(?:System\.)?Console\.(?:WriteLine|Write)(?=\s*\()|(?:std::)?cout\s*<<|(?:std::)?(?:printf|puts|println)(?=\s*\())/g
  let match: RegExpExecArray | null

  while ((match = outputCall.exec(code)) !== null) {
    if (isInsideLiteral(code, match.index)) continue

    const expressionStart = match.index
    const expressionEnd = findStatementEnd(code, outputCall.lastIndex)
    const segment = code.slice(expressionStart, expressionEnd === -1 ? code.length : expressionEnd)
    if (containsLiteralContent(segment, requirement)) return true
  }

  return false
}

/**
 * Match a quoted-output requirement only when its occurrence begins in real
 * source code, rather than inside a larger string or template literal.
 */
function containsQuotedRequirement(code: string, requirement: string): boolean {
  let searchFrom = 0

  while (searchFrom <= code.length - requirement.length) {
    const index = code.indexOf(requirement, searchFrom)
    if (index === -1) return false

    let quote: Quote | null = null
    let verbatim = false
    let escaped = false
    for (let i = 0; i < index; i += 1) {
      const current = code[i]
      const next = code[i + 1]
      const previous = i > 0 ? code[i - 1] : ''
      if (quote) {
        if (verbatim) {
          if (current === '"' && next === '"') i += 1
          else if (current === '"') {
            quote = null
            verbatim = false
          }
        } else if (escaped) escaped = false
        else if (current === '\\') escaped = true
        else if (current === quote) quote = null
      } else if (current === '"' || current === "'" || current === '`') {
        quote = current
        verbatim = current === '"' && previous === '@'
      }
    }

    if (!quote) return true
    searchFrom = index + 1
  }

  return false
}

/** Deterministic verifier used until the Academy gains compiler-backed execution. */
export function verifyLessonCode(lesson: Lesson, code: string): VerificationResult {
  if (lesson.checks.length === 0) {
    return { passedChecks: [], passedCount: 0, complete: false, failedIndex: 0 }
  }

  const executableCode = stripComments(code)
  const structuralCode = normalizeStructuralSyntax(maskLiteralContents(executableCode))
  const passedChecks = lesson.checks.map((rawCheck) => {
    const check = normalizeCheck(rawCheck)
    if (check.value.length === 0) return false

    if (check.kind === 'quoted') {
      return containsQuotedRequirement(executableCode, check.value)
    }

    if (check.kind === 'output') {
      return containsPrintedLiteralContent(executableCode, check.value)
    }

    return containsStructuralRequirement(structuralCode, check.value)
  })
  const failedIndex = passedChecks.findIndex((passed) => !passed)
  return {
    passedChecks,
    passedCount: passedChecks.filter(Boolean).length,
    complete: failedIndex === -1,
    failedIndex,
  }
}
