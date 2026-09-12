'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, Circle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Track } from '@/lib/academy-data'
import { getLessonPrerequisiteId, isLessonUnlocked } from '@/lib/academy-progression'

type SyllabusTreeProps = {
  tracks: Track[]
  activeLessonId: string
  completedIds: Set<string>
  onSelectLesson: (lessonId: string) => void
}

function getModuleKey(trackId: string, moduleId: string) {
  return `${trackId}:${moduleId}`
}

export function SyllabusTree({
  tracks,
  activeLessonId,
  completedIds,
  onSelectLesson,
}: SyllabusTreeProps) {
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(tracks.flatMap((t) => t.modules.map((m) => getModuleKey(t.id, m.id)))),
  )

  function toggleModule(trackId: string, moduleId: string) {
    const key = getModuleKey(trackId, moduleId)
    setOpenModules((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <nav aria-label="Course syllabus" className="flex flex-col gap-6">
      {tracks.map((track) => {
        if (!track.available) {
          return (
            <div
              key={track.id}
              className="relative overflow-hidden rounded-xl border border-white/5 bg-neutral-900/40 p-4"
            >
              <div className="pointer-events-none absolute inset-0 backdrop-blur-[3px]" />
              <div className="relative flex items-center justify-between opacity-60">
                <div className="flex items-center gap-2.5">
                  <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-semibold tracking-tight text-foreground/60">
                    {track.name}
                  </span>
                </div>
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-tight text-accent-foreground/70">
                  Coming Soon
                </span>
              </div>
            </div>
          )
        }

        const trackPoints = track.modules
          .flatMap((m) => m.lessons)
          .reduce((sum, l) => sum + (completedIds.has(l.id) ? l.points : 0), 0)

        return (
          <div key={track.id}>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold tracking-tighter text-foreground">
                {track.name}
              </h3>
              <span className="font-mono text-xs text-primary">
                {trackPoints} pts
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {track.modules.map((module) => {
                const moduleKey = getModuleKey(track.id, module.id)
                const isOpen = openModules.has(moduleKey)
                const lessonListId = `academy-${track.id}-module-${module.id}`
                return (
                  <div
                    key={moduleKey}
                    className="overflow-hidden rounded-xl border border-white/5 bg-[#060608]/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleModule(track.id, module.id)}
                      aria-expanded={isOpen}
                      aria-controls={lessonListId}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="text-sm tracking-tight text-foreground/85">
                        {module.title}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          'size-4 text-muted-foreground transition-transform',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    {isOpen && (
                      <ul id={lessonListId} className="border-t border-white/5 py-1">
                        {module.lessons.map((lesson) => {
                          const done = completedIds.has(lesson.id)
                          const unlocked = isLessonUnlocked(track, lesson.id, completedIds)
                          const active = lesson.id === activeLessonId
                          const prerequisiteId = getLessonPrerequisiteId(track, lesson.id)
                          const prerequisiteTitle = prerequisiteId
                            ? track.modules
                                .flatMap((m) => m.lessons)
                                .find((candidate) => candidate.id === prerequisiteId)?.title
                            : undefined
                          const lockedReason = prerequisiteTitle
                            ? `Complete “${prerequisiteTitle}” to unlock this lesson`
                            : 'Complete the prerequisite lesson to unlock this lesson'
                          return (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                onClick={() => onSelectLesson(lesson.id)}
                                disabled={!unlocked}
                                aria-current={active ? 'true' : undefined}
                                aria-disabled={!unlocked}
                                title={unlocked ? undefined : lockedReason}
                                className={cn(
                                  'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors',
                                  active
                                    ? 'bg-primary/10 text-primary'
                                    : unlocked
                                      ? 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                      : 'cursor-not-allowed text-muted-foreground/35',
                                )}
                              >
                                <span className="flex items-center gap-2.5">
                                  {done ? (
                                    <CheckCircle2
                                      className="size-4 shrink-0 text-success"
                                      aria-hidden="true"
                                    />
                                  ) : unlocked ? (
                                    <Circle
                                      className="size-4 shrink-0 opacity-40"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Lock
                                      className="size-4 shrink-0 opacity-40"
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span className="text-sm tracking-tight">
                                    {lesson.title}
                                  </span>
                                </span>
                                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                                  +{lesson.points}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
