'use client'

import { useMemo, useState } from 'react'
import { ScoreGauge } from '@/components/academy/score-gauge'
import { SyllabusTree } from '@/components/academy/syllabus-tree'
import { LessonWorkspace } from '@/components/academy/lesson-workspace'
import { tracks, maxPoints, type Lesson } from '@/lib/academy-data'

type LessonRef = {
  lesson: Lesson
  trackName: string
  moduleName: string
}

const lessonIndex = new Map<string, LessonRef>()
for (const track of tracks) {
  for (const module of track.modules) {
    for (const lesson of module.lessons) {
      lessonIndex.set(lesson.id, {
        lesson,
        trackName: track.name,
        moduleName: module.title,
      })
    }
  }
}

const firstLessonId = tracks[0].modules[0].lessons[0].id

export function AcademyDashboard() {
  const [activeLessonId, setActiveLessonId] = useState(firstLessonId)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [codeByLesson, setCodeByLesson] = useState<Record<string, string>>({})

  const active = lessonIndex.get(activeLessonId) ?? lessonIndex.get(firstLessonId)!

  const totalScore = useMemo(
    () =>
      [...completedIds].reduce(
        (sum, id) => sum + (lessonIndex.get(id)?.lesson.points ?? 0),
        0,
      ),
    [completedIds],
  )

  const code = codeByLesson[active.lesson.id] ?? active.lesson.starterCode

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
      {/* Top header metrics */}
      <header className="mb-8 flex flex-col gap-6 rounded-2xl border border-white/5 bg-neutral-900/40 p-6 shadow-2xl backdrop-blur-md md:flex-row md:items-center md:justify-between lg:p-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-tight text-primary">
            Zenith Academy
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tighter md:text-4xl">
            Engineering Curriculum
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Learn by shipping. Every lesson is verified against a live
            assertion engine.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <ScoreGauge score={totalScore} max={maxPoints} />
          <div className="hidden flex-col gap-1 border-l border-white/10 pl-8 lg:flex">
            <p className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
              Lessons cleared
            </p>
            <p className="text-lg font-semibold tracking-tighter">
              {completedIds.size}
              <span className="text-sm text-muted-foreground">
                {' '}
                / {lessonIndex.size}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* 30 / 70 split */}
      <div className="grid gap-6 lg:grid-cols-[3fr_7fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SyllabusTree
            tracks={tracks}
            activeLessonId={active.lesson.id}
            completedIds={completedIds}
            onSelectLesson={setActiveLessonId}
          />
        </aside>

        <section aria-label="Active lesson workspace">
          <LessonWorkspace
            key={active.lesson.id}
            lesson={active.lesson}
            trackName={active.trackName}
            moduleName={active.moduleName}
            code={code}
            onCodeChange={(next) =>
              setCodeByLesson((prev) => ({ ...prev, [active.lesson.id]: next }))
            }
            onPass={() =>
              setCompletedIds((prev) => new Set(prev).add(active.lesson.id))
            }
            isCompleted={completedIds.has(active.lesson.id)}
          />
        </section>
      </div>
    </div>
  )
}
