import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Academy workspace bounds persisted code to its storage budget', async () => {
  const workspace = await read('components/academy/lesson-workspace.tsx')
  assert.match(workspace, /maxLength=\{100_000\}/)
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
  assert.match(syllabus, /disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-disabled=\{!unlocked\}/)
  assert.match(syllabus, /aria-current=\{active \? 'page' : undefined\}/)
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
  const dashboard = await read('components/academy/academy-dashboard.tsx')
  assert.match(dashboard, /import \{ getUnlockedLessonIds, sanitizeCompletedLessonIds \} from '@\/lib\/academy-progression'/)
  assert.match(dashboard, /const restoredCompletedIds = sanitizeCompletedLessonIds\(tracks, new Set\(saved\.completedIds \?\? \[\]\)\)/)
  assert.match(dashboard, /const unlocked = getUnlockedLessonIds\(tracks, restoredCompletedIds\)/)
})
