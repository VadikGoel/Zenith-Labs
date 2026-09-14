import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

async function read(path) {
  return readFile(resolve(root, path), 'utf8')
}

test('Academy workspace keeps learning instructions independent from verification checks', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /Verification requirements/)
  assert.match(workspace, /\{verification\.passedCount\}\/\{lesson\.checks\.length\} verified/)
  assert.match(workspace, /lesson\.instructions\.map\(\(instruction, i\) => \(/)
  assert.match(workspace, /verifyLessonCode\(lesson, code\)/)
  assert.doesNotMatch(workspace, /const passedChecks = lesson\.checks\.map/)
})

test('Academy workspace blocks malformed lessons without verification checks', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /if \(lesson\.checks\.length === 0\) \{[\s\S]*NO VERIFICATION CHECKS CONFIGURED — submission blocked[\s\S]*setRunning\(false\)[\s\S]*return\n    \}/)
  assert.match(workspace, /if \(lesson\.checks\.length === 0\) \{[\s\S]*return\n    \}\n\n    if \(timeoutRef\.current\) clearTimeout\(timeoutRef\.current\)/)
})

test('Academy workspace accurately labels deterministic verification instead of simulated compilation', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /checking requirements\.\.\./)
  assert.match(workspace, /requirements checked \(deterministic source analysis\)/)
  assert.doesNotMatch(workspace, /compiling\.\.\. done/)
})

test('Academy verification service strips comments before evaluating typed requirements', async () => {
  const verifier = await read('lib/academy-verification.ts')
  assert.match(verifier, /function stripComments\(code: string\)/)
  assert.match(verifier, /current === '\/' && next === '\/'/)
  assert.match(verifier, /current === '\/' && next === '\*'/)
  assert.match(verifier, /const executableCode = stripComments\(code\)/)
  assert.match(verifier, /const check = normalizeCheck\(rawCheck\)/)
  assert.match(verifier, /const structuralCode = normalizeStructuralSyntax\(maskLiteralContents\(executableCode\)\)/)
  assert.match(verifier, /containsStructuralRequirement\(structuralCode, check\.value\)/)
})

test('Academy output checks only match human-readable text inside recognized output expressions', async () => {
  const verifier = await read('lib/academy-verification.ts')
  assert.match(verifier, /if \(check\.kind === 'output'\) \{[\s\S]*return containsPrintedLiteralContent\(executableCode, check\.value\)/)
  assert.match(verifier, /function containsPrintedLiteralContent\(code: string, requirement: string\)/)
  assert.match(verifier, /if \(isInsideLiteral\(code, match\.index\)\) continue/)
  assert.doesNotMatch(verifier, /if \(check\.kind === 'output'\) \{[\s\S]*return structuralCode\.includes\(check\.value\) \|\| containsLiteralContent/)
})

test('Academy verification preserves quoted source text while stripping comments', async () => {
  const verifier = await read('lib/academy-verification.ts')
  assert.match(verifier, /if \(quote\)/)
  assert.match(verifier, /current === '\\\\'/)
  assert.match(verifier, /current === quote/)
  assert.match(verifier, /containsQuotedRequirement\(executableCode, check\.value\)/)
})

test('Academy verification rejects blank requirements instead of passing them implicitly', async () => {
  const verifier = await read('lib/academy-verification.ts')
  assert.match(verifier, /const check = normalizeCheck\(rawCheck\)/)
  assert.match(verifier, /if \(check\.value\.length === 0\) return false/)
})

test('Academy verification service owns deterministic typed requirement evaluation', async () => {
  const verifier = await read('lib/academy-verification.ts')
  assert.match(verifier, /export function verifyLessonCode\(lesson: Lesson, code: string\)/)
  assert.match(verifier, /lesson\.checks\.map\(\(rawCheck\) => \{[\s\S]*normalizeCheck\(rawCheck\)/)
  assert.match(verifier, /passedChecks\.filter\(Boolean\)\.length/)
  assert.match(verifier, /complete: failedIndex === -1/)
  assert.match(verifier, /const failedIndex = passedChecks\.findIndex\(\(passed\) => !passed\)/)
})

test('Academy verification timer is cleaned up on unmount and completion', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /useEffect\(\(\) => \{[\s\S]*?clearTimeout\(timeoutRef\.current\)/)
  assert.match(workspace, /timeoutRef\.current = null/)
})

test('Academy verification exposes its busy state to assistive technology', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /disabled=\{running\}/)
  assert.match(workspace, /aria-busy=\{running\}/)
})

test('Academy syllabus enforces centralized sequential progression accessibly', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /import \{ getLessonPrerequisiteId, isLessonUnlocked \} from '@\/lib\/academy-progression'/)
  assert.match(syllabus, /const unlocked = isLessonUnlocked\(track, lesson\.id, completedIds\)/)
  assert.doesNotMatch(syllabus, /function isUnlocked\(track: Track, lessonId: string\)/)
  assert.doesNotMatch(syllabus, /completedIds\.has\(lessons\[index - 1\]\?\.id \?\? ''\)/)
  assert.doesNotMatch(syllabus, /\n\s+disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-current=\{active \? 'true' : undefined\}/)
  assert.match(syllabus, /aria-label=\{unlocked \? lesson\.title : `\$\{lesson\.title\}\. \$\{lockedReason\}`\}/)
  assert.match(syllabus, /const lockedReason = prerequisiteTitle/)
  assert.match(syllabus, /Complete “\$\{prerequisiteTitle\}” to unlock this lesson/)
  assert.match(syllabus, /function getModuleKey\(trackId: string, moduleId: string\)/)
  assert.match(syllabus, /const moduleKey = getModuleKey\(track\.id, module\.id\)/)
  assert.match(syllabus, /const \[openModules, setOpenModules\] = useState<Set<string>>\(/)
  assert.match(syllabus, /onClick=\{\(\) => toggleModule\(track\.id, module\.id\)\}/)
  assert.match(syllabus, /aria-controls=\{lessonListId\}/)
  assert.match(syllabus, /<ul id=\{lessonListId\} hidden=\{!isOpen\}/)
  assert.doesNotMatch(syllabus, /\{isOpen && \(\s*<ul id=\{lessonListId\}/)
  assert.match(syllabus, /<Lock[\s\S]*aria-hidden="true"/)
})

test('Academy restores only an unlocked lesson from persisted progress', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /isLessonUnlocked\(/)
})

test('Academy persistence bounds untrusted localStorage payloads', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /localStorage/)
  assert.match(workspace, /JSON\.parse/)
})

test('Academy flushes committed progress on page lifecycle changes', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /visibilitychange|pagehide|beforeunload/)
})

test('Academy accurately describes deterministic verification', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /deterministic source analysis/)
})

test('Academy syllabus uses accessible semantic lesson controls', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /aria-/)
})

test('Academy lesson workspace exposes accessible editor and verification output', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /aria-/)
})

test('Academy editor cannot change while verification is running', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /disabled=\{running\}/)
})

test('Zenith UI animations respect prefers-reduced-motion', async () => {
  const styles = await read('app/globals.css')
  assert.match(styles, /prefers-reduced-motion/)
})

test('mobile navigation toggle exposes its controlled menu region', async () => {
  const nav = await read('components/site-navigation.tsx')
  assert.match(nav, /aria-controls/)
})

test('navigation links expose the active page semantically', async () => {
  const nav = await read('components/site-navigation.tsx')
  assert.match(nav, /aria-current/)
})

test('locked Academy lessons remain keyboard discoverable with an accessible reason', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /aria-label=/)
})

test('active Academy lesson buttons use boolean aria-current state', async () => {
  const syllabus = await read('components/academy/syllabus-tree.tsx')
  assert.match(syllabus, /aria-current=\{active \? 'true' : undefined\}/)
})
