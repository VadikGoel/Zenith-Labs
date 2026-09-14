export type VerificationCheckKind = 'structural' | 'output' | 'quoted'

export type VerificationCheck = {
  kind: VerificationCheckKind
  value: string
}

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

function isVerificationCheckKind(value: unknown): value is VerificationCheckKind {
  return value === 'structural' || value === 'output' || value === 'quoted'
}

/** Normalize legacy or typed checks and fail closed on malformed runtime data. */
export function normalizeCheck(value: string | VerificationCheck): VerificationCheck {
  if (typeof value === 'string') return normalizeLegacyCheck(value)
  if (!value || typeof value !== 'object') return { kind: 'structural', value: '' }
  if (!isVerificationCheckKind(value.kind) || typeof value.value !== 'string') {
    return { kind: 'structural', value: '' }
  }
  return { kind: value.kind, value: value.value.trim() }
}
