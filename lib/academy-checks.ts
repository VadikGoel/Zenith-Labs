export type VerificationCheckKind = 'structural' | 'output' | 'quoted'

export type VerificationCheck = {
  kind: VerificationCheckKind
  value: string
}

/**
 * Convert the existing string-based curriculum checks into the new explicit
 * contract without changing their current verification behavior.
 *
 * New lessons can eventually declare the kind directly; existing lessons stay
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
