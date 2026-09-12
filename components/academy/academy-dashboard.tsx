'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ScoreGauge } from '@/components/academy/score-gauge'
import { SyllabusTree } from '@/components/academy/syllabus-tree'
import { LessonWorkspace } from '@/components/academy/lesson-workspace'
import { tracks, maxPoints, type Lesson } from '@/lib/academy-data'
import { getUnlockedLessonIds, sanitizeCompletedLessonIds } from '@/lib/academy-progression'

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

const firstAvailableTrack = tracks.find((track) => track.available)
const firstLessonId = firstAvailableTrack?.modules
  .flatMap((module) => module.lessons)
  .find((lesson) => lesson !== undefined)?.id ?? (() => {
  throw new Error('Academy curriculum must contain an available track with at least one lesson')
})()

const STORAGE_KEY = 'zenith-academy-progress-v1'
const MAX_PERSISTED_JSON_LENGTH = 1_000_000
const MAX_SAVED_CODE_LENGTH = 100_000
const CODE_PERSIST_DEBOUNCE_MS = 250

type StoredProgress = {
  activeLessonId?: string
  completedIds?: string[]
  codeByLesson?: Record<string, string>
}

function loadProgress(): StoredProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw || raw.length > MAX_PERSISTED_JSON_LENGTH) return {}
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
              ([id, code]) => lessonIndex.has(id) && typeof code === 'string' && code.length <= MAX_SAVED_CODE_LENGTH,
            ),
          )
        : {},
    }
  } catch {
    return {}
  }
}

function serializeProgress(progress: StoredProgress): string {
  const base = {
    activeLessonId: progress.activeLessonId,
    completedIds: progress.completedIds ?? [],
  }
  const codeEntries = Object.entries(progress.codeByLesson ?? {})
    .filter(([id, code]) => lessonIndex.has(id) && typeof code === 'string' && code.length <= MAX_SAVED_CODE_LENGTH)

  const prioritizedIds = [
    progress.activeLessonId,
    ...(progress.completedIds ?? []),
    ...[...lessonIndex.keys()],
  ].filter((id, index, ids): id is string => Boolean(id) && ids.indexOf(id) === index)

  const byId = new Map(codeEntries)
  const codeByLesson: Record<string, string> = {}
  const baseLength = JSON.stringify(base).length
  const codeFieldPrefix = ',"codeByLesson":'
  let codeObjectLength = 2

  for (const id of prioritizedIds) {
    const code = byId.get(id)
    if (code === undefined) continue

    const entryLength = JSON.stringify(id).length + 1 + JSON.stringify(code).length
    const commaLength = Object.keys(codeByLesson).length > 0 ? 1 : 0
    const nextCodeObjectLength = codeObjectLength + commaLength + entryLength
    const candidateLength = baseLength + codeFieldPrefix.length + nextCodeObjectLength
    if (candidateLength > MAX_PERSISTED_JSON_LENGTH) break

    codeByLesson[id] = code
    codeObjectLength = nextCodeObjectLength
  }

  return JSON.stringify({ ...base, codeByLesson })
}

function persistProgress(progress: StoredProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeProgress(progress))
  } catch {
    // Storage may be unavailable (private browsing, quota, or policy). The
    // in-memory Academy experience remains fully usable in that case.
  }
}

type ProgressSnapshot = {
  activeLessonId: string
  completedIds: Set<string>
  codeByLesson: Record<string, string>
}

export function AcademyDashboard() {
  const [activeLessonId, setActiveLessonId] = useState(firstLessonId)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [codeByLesson, setCodeByLesson] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)
  const progressRef = useRef<ProgressSnapshot>({
    activeLessonId: firstLessonId,
    completedIds: new Set(),
    codeByLesson: {},
  })

  useEffect(() => {
    const saved = loadProgress()
    const restoredCompletedIds = sanitizeCompletedLessonIds(tracks, new Set(saved.completedIds ?? []))
    const unlocked = getUnlockedLessonIds(tracks, restoredCompletedIds)

    if (saved.activeLessonId && unlocked.has(saved.activeLessonId)) {
      setActiveLessonId(saved.activeLessonId)
    } else {
      setActiveLessonId(firstLessonId)
    }
    setCompletedIds(restoredCompletedIds)
    if (saved.codeByLesson) setCodeByLesson(saved.codeByLesson)
    setHydrated(true)
  }, [])

  progressRef.current = { activeLessonId, completedIds, codeByLesson }

  useEffect(() => {
    if (!hydrated) return
    persistProgress({
      activeLessonId,
      completedIds: [...completedIds],
      codeByLesson,
    })
  }, [activeLessonId, completedIds, hydrated, codeByLesson])

  useEffect(() => {
    if (!hydrated) return

    const timeoutId = window.setTimeout(() => {
      const snapshot = progressRef.current
      persistProgress({
        activeLessonId: snapshot.activeLessonId,
        completedIds: [...snapshot.completedIds],
        codeByLesson: snapshot.codeByLesson,
      })
    }, CODE_PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [codeByLesson, hydrated])

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
