import type { Lesson, Track } from './academy-data'

export type CurriculumIssue = {
  code: 'duplicate-track-id' | 'duplicate-module-id' | 'duplicate-lesson-id' | 'missing-prerequisite' | 'implicit-prerequisite' | 'cross-track-prerequisite' | 'prerequisite-cycle' | 'first-lesson-prerequisite' | 'forward-prerequisite' | 'empty-track' | 'empty-module' | 'empty-instructions' | 'empty-checks' | 'empty-success-output'
  trackId: string
  lessonId?: string
  prerequisiteId?: string
}

function flattenLessons(track: Track): Lesson[] {
  return track.modules.flatMap((module) => module.lessons)
}

export function validateCurriculum(tracks: Track[]): CurriculumIssue[] {
  const issues: CurriculumIssue[] = []
  const trackIds = new Set<string>()
  const lessonOwners = new Map<string, string>()

  for (const track of tracks) {
    if (trackIds.has(track.id)) issues.push({ code: 'duplicate-track-id', trackId: track.id })
    trackIds.add(track.id)
    if (track.available && track.modules.length === 0) issues.push({ code: 'empty-track', trackId: track.id })
    const moduleIds = new Set<string>()
    for (const module of track.modules) {
      if (moduleIds.has(module.id)) issues.push({ code: 'duplicate-module-id', trackId: track.id })
      moduleIds.add(module.id)
      if (track.available && module.lessons.length === 0) issues.push({ code: 'empty-module', trackId: track.id })
    }
    for (const lesson of flattenLessons(track)) {
      if (lessonOwners.has(lesson.id)) issues.push({ code: 'duplicate-lesson-id', trackId: track.id, lessonId: lesson.id })
      else lessonOwners.set(lesson.id, track.id)
    }
  }

  for (const track of tracks) {
    const lessons = flattenLessons(track)
    const localIds = new Set(lessons.map((lesson) => lesson.id))
    const indexes = new Map(lessons.map((lesson, index) => [lesson.id, index]))
    const graph = new Map<string, string>()
    for (const [index, lesson] of lessons.entries()) {
      if (lesson.instructions.length === 0) issues.push({ code: 'empty-instructions', trackId: track.id, lessonId: lesson.id })
      if (lesson.checks.length === 0) issues.push({ code: 'empty-checks', trackId: track.id, lessonId: lesson.id })
      if (lesson.successOutput.length === 0) issues.push({ code: 'empty-success-output', trackId: track.id, lessonId: lesson.id })
      const prerequisiteId = lesson.prerequisiteId
      if (!prerequisiteId) {
        if (track.available && index > 0) issues.push({ code: 'implicit-prerequisite', trackId: track.id, lessonId: lesson.id })
        continue
      }
      if (!localIds.has(prerequisiteId)) {
        issues.push({ code: lessonOwners.has(prerequisiteId) ? 'cross-track-prerequisite' : 'missing-prerequisite', trackId: track.id, lessonId: lesson.id, prerequisiteId })
      }
      if (index === 0) issues.push({ code: 'first-lesson-prerequisite', trackId: track.id, lessonId: lesson.id, prerequisiteId })
      const prerequisiteIndex = indexes.get(prerequisiteId)
      if (prerequisiteIndex !== undefined && prerequisiteIndex >= index) {
        issues.push({ code: 'forward-prerequisite', trackId: track.id, lessonId: lesson.id, prerequisiteId })
      }
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
