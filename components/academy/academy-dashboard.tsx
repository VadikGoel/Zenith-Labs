'use client'

import { useEffect, useMemo, useState } from 'react'
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
const STORAGE_KEY = 'zenith-academy-progress-v1'

type StoredProgress = {
  activeLessonId?: string
  completedIds?: string[]
  codeByLesson?: Record<string, string>
}

function getUnlockedLessonIds(completedIds: Set<string>) {
  const unlocked = new Set<string>()

  for (const track of tracks) {
    if (!track.available) continue
    const lessons = track.modules.flatMap((module) => module.lessons)
    for (let index = 0; index < lessons.length; index += 1) {
      const lesson = lessons[index]
      if (index === 0 || completedIds.has(lessons[index - 1]?.id ?? '')) {
        unlocked.add(lesson.id)
      }
    }
  }

  return unlocked
}

function loadProgress(): StoredProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const value = parsed as StoredProgress
    return {
      activeLessonId: typeof value.activeLessonId === 'string' && lessonIndex.has(value.activeLessonId)
        ? value.activeLessonId
        : undefined,
      completedIds: Array.isArray(value.completedIds)
        ? value.completedIds.filter((id): id is string => typeof id === 'string' && lessonIndex.has(id))
        : [],
      codeByLesson: value.codeByLesson && typeof value.codeByLesson === 'object'
        ? Object.fromEntries(
            Object.entries(value.codeByLesson).filter(
              ([id, code]) => lessonIndex.has(id) && typeof code === 'string',
            ),
          )
        : {},
    }
  } catch {
    return {}
  }
}

export function AcademyDashboard() {
  const [activeLessonId, setActiveLessonId] = useState(firstLessonId)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [codeByLesson, setCodeByLesson] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = loadProgress()
    const restoredCompletedIds = new Set(saved.completedIds ?? [])
    const unlocked = getUnlockedLessonIds(restoredCompletedIds)

    if (saved.activeLessonId && unlocked.has(saved.activeLessonId)) {
      setActiveLessonId(saved.activeLessonId)
    } else {
      setActiveLessonId(firstLessonId)
    }
    setCompletedIds(restoredCompletedIds)
    if (saved.codeByLesson) setCodeByLesson(saved.codeByLesson)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeLessonId,
          completedIds: [...completedIds],
          codeByLesson,
        } satisfies StoredProgress),
      )
    } catch {
      // Storage may be unavailable (private browsing, quota, or policy). The
      // in-memory Academy experience remains fully usable in that case.
    }
  }, [activeLessonId, completedIds, codeByLesson, hydrated])

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
