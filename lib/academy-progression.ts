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
 * Removes forged/stale completion records by accepting only the contiguous
 * completion prefix that can actually be reached through the track rules.
 */
export function sanitizeCompletedLessonIds(tracks: Track[], candidateIds: Set<string>): Set<string> {
  const sanitized = new Set<string>()

  for (const track of tracks) {
    if (!track.available) continue

    for (const lesson of flattenTrackLessons(track)) {
      if (!candidateIds.has(lesson.id)) break
      const prerequisiteId = getLessonPrerequisiteId(track, lesson.id)
      if (prerequisiteId !== null && !sanitized.has(prerequisiteId)) break
      sanitized.add(lesson.id)
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
