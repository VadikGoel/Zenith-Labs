import type { Lesson, Track } from './academy-data'

type LessonWithPrerequisite = Lesson & { prerequisiteId?: string }

export function flattenTrackLessons(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons)
}

/**
 * Returns the lesson that must be completed before the requested lesson.
 * Explicit prerequisite metadata takes precedence; the sequential fallback
 * keeps the existing curriculum compatible while metadata is introduced.
 */
export function getLessonPrerequisiteId(track: Track, lessonId: string): string | null {
  const lessons = flattenTrackLessons(track) as LessonWithPrerequisite[]
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)

  if (index < 0) return null
  return lessons[index]?.prerequisiteId ?? (index <= 0 ? null : lessons[index - 1]?.id ?? null)
}

export function isLessonUnlocked(track: Track, lessonId: string, completedIds: Set<string>): boolean {
  if (!track.available) return false

  const lessons = flattenTrackLessons(track)
  if (!lessons.some((lesson) => lesson.id === lessonId)) return false

  const prerequisiteId = getLessonPrerequisiteId(track, lessonId)
  return prerequisiteId === null || completedIds.has(prerequisiteId)
}

/**
 * Removes forged/stale completion records while respecting explicit
 * prerequisites. Unlike the legacy sequential model, a valid explicit graph
 * may allow a lesson to be completed without completing unrelated lessons
 * that happen to appear earlier in the curriculum order.
 */
export function sanitizeCompletedLessonIds(tracks: Track[], candidateIds: Set<string>): Set<string> {
  const sanitized = new Set<string>()

  for (const track of tracks) {
    if (!track.available) continue

    const lessons = flattenTrackLessons(track)
    const localIds = new Set(lessons.map((lesson) => lesson.id))
    let changed = true

    while (changed) {
      changed = false
      for (const lesson of lessons) {
        if (!candidateIds.has(lesson.id) || sanitized.has(lesson.id)) continue

        const prerequisiteId = getLessonPrerequisiteId(track, lesson.id)
        const prerequisiteSatisfied = prerequisiteId === null
          || (localIds.has(prerequisiteId) && sanitized.has(prerequisiteId))

        if (prerequisiteSatisfied) {
          sanitized.add(lesson.id)
          changed = true
        }
      }
    }
  }

  return sanitized
}

export function getUnlockedLessonIds(tracks: Track[], completedIds: Set<string>): Set<string> {
  const unlocked = new Set<string>()

  for (const track of tracks) {
    if (!track.available) continue

    for (const lesson of flattenTrackLessons(track)) {
      if (isLessonUnlocked(track, lesson.id, completedIds)) {
        unlocked.add(lesson.id)
      }
    }
  }

  return unlocked
}
