import type { Lesson, Track } from './academy-data'

export function flattenTrackLessons(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons)
}

/**
 * Returns the lesson that must be completed before the requested lesson.
 * The first lesson in each available track has no prerequisite.
 */
export function getLessonPrerequisiteId(track: Track, lessonId: string): string | null {
  const lessons = flattenTrackLessons(track)
  const index = lessons.findIndex((lesson) => lesson.id === lessonId)

  if (index <= 0) return null
  return lessons[index - 1]?.id ?? null
}

export function isLessonUnlocked(track: Track, lessonId: string, completedIds: Set<string>): boolean {
  const prerequisiteId = getLessonPrerequisiteId(track, lessonId)
  return prerequisiteId === null || completedIds.has(prerequisiteId)
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
