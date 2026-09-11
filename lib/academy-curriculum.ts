import type { Lesson, Track } from './academy-data'
import { flattenTrackLessons } from './academy-progression'

type LessonWithPrerequisite = Lesson & { prerequisiteId?: string }

export type CurriculumIssue = {
  code: 'duplicate-track-id' | 'duplicate-module-id' | 'duplicate-lesson-id' | 'missing-prerequisite' | 'cross-track-prerequisite' | 'prerequisite-cycle' | 'first-lesson-prerequisite'
  trackId: string
  lessonId?: string
  prerequisiteId?: string
}

export function validateCurriculum(tracks: Track[]): CurriculumIssue[] {
  const issues: CurriculumIssue[] = []
  const trackIds = new Set<string>()
  const lessonOwners = new Map<string, string>()

  for (const track of tracks) {
    if (trackIds.has(track.id)) issues.push({ code: 'duplicate-track-id', trackId: track.id })
    trackIds.add(track.id)
    const moduleIds = new Set<string>()
    for (const module of track.modules) {
      if (moduleIds.has(module.id)) issues.push({ code: 'duplicate-module-id', trackId: track.id })
      moduleIds.add(module.id)
    }
    for (const lesson of flattenTrackLessons(track)) {
      if (lessonOwners.has(lesson.id)) issues.push({ code: 'duplicate-lesson-id', trackId: track.id, lessonId: lesson.id })
      else lessonOwners.set(lesson.id, track.id)
    }
  }

  for (const track of tracks) {
    const lessons = flattenTrackLessons(track) as LessonWithPrerequisite[]
    const localIds = new Set(lessons.map((lesson) => lesson.id))
    const graph = new Map<string, string>()
    for (const [index, lesson] of lessons.entries()) {
      const prerequisiteId = lesson.prerequisiteId
      if (!prerequisiteId) continue
      if (!localIds.has(prerequisiteId)) issues.push({ code: lessonOwners.has(prerequisiteId) ? 'cross-track-prerequisite' : 'missing-prerequisite', trackId: track.id, lessonId: lesson.id, prerequisiteId })
      if (index === 0) issues.push({ code: 'first-lesson-prerequisite', trackId: track.id, lessonId: lesson.id, prerequisiteId })
      graph.set(lesson.id, prerequisiteId)
    }
    const visiting = new Set<string>()
    const visited = new Set<string>()
    const visit = (lessonId: string): boolean => {
      if (visited.has(lessonId)) return false
      if (visiting.has(lessonId)) return true
      visiting.add(lessonId)
      const prerequisiteId = graph.get(lessonId)
      const cycle = prerequisiteId && graph.has(prerequisiteId) ? visit(prerequisiteId) : false
      visiting.delete(lessonId)
      visited.add(lessonId)
      return cycle
    }
    for (const lesson of lessons) {
      if (visit(lesson.id)) {
        issues.push({ code: 'prerequisite-cycle', trackId: track.id, lessonId: lesson.id })
        break
      }
    }
  }
  return issues
}
