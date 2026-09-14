export type VerificationCheckKind = 'structural' | 'output' | 'quoted'

export type VerificationCheck = {
  kind: VerificationCheckKind
  value: string
}

/** The compatibility contract used while the curriculum migrates to typed checks. */
export type CurriculumCheck = string | VerificationCheck

/**
 * Convert the existing string-based curriculum checks into the new explicit
 * contract without changing their current verification behavior.
 *
 * New lessons can declare the kind directly; existing lessons stay
 * source-compatible while the curriculum is migrated incrementally.
 */
export function normalizeLegacyCheck(value: string): VerificationCheck {
  const normalized = value.trim()
  if (normalized.includes('"') || normalized.includes("'")) {
    return { kind: 'quoted', value: normalized }
  }
  if (/\s/.test(normalized)) {
    return { kind: 'output', value: normalized }
  }
  return { kind: 'structural', value: normalized }
}

export function isVerificationCheck(value: unknown): value is VerificationCheck {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { kind?: unknown; value?: unknown }
  return (
    (candidate.kind === 'structural' || candidate.kind === 'output' || candidate.kind === 'quoted') &&
    typeof candidate.value === 'string'
  )
}

export function isCurriculumCheck(value: unknown): value is CurriculumCheck {
  return typeof value === 'string' || isVerificationCheck(value)
}

/** Normalize legacy or typed checks and fail closed on malformed runtime data. */
export function normalizeCheck(value: unknown): VerificationCheck {
  if (typeof value === 'string') return normalizeLegacyCheck(value)
  if (!isVerificationCheck(value)) return { kind: 'structural', value: '' }
  return { kind: value.kind, value: value.value.trim() }
}
