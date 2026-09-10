'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckSquare, Play, Square, TerminalSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lesson } from '@/lib/academy-data'

type LessonWorkspaceProps = {
  lesson: Lesson
  trackName: string
  moduleName: string
  code: string
  onCodeChange: (code: string) => void
  onPass: () => void
  isCompleted: boolean
}

export function LessonWorkspace({
  lesson,
  trackName,
  moduleName,
  code,
  onCodeChange,
  onPass,
  isCompleted,
}: LessonWorkspaceProps) {
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'zenith-verification-engine v3.1.0',
    'awaiting submission...',
  ])
  const [running, setRunning] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const passedChecks = lesson.checks.map((check) => code.includes(check))

  function runVerification() {
    if (running) return
    setRunning(true)
    setTerminalLines(['> zenith verify --lesson ' + lesson.id, 'compiling...'])

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const failedIndex = passedChecks.findIndex((p) => !p)
      if (failedIndex === -1) {
        setTerminalLines([
          '> zenith verify --lesson ' + lesson.id,
          'compiling... done (0.42s)',
          ...lesson.successOutput,
        ])
        onPass()
      } else {
        setTerminalLines([
          '> zenith verify --lesson ' + lesson.id,
          'compiling... done (0.38s)',
          `ASSERTION FAILED [${failedIndex + 1}/${lesson.checks.length}]`,
          `expected code to contain: ${lesson.checks[failedIndex]}`,
          '',
          'VERIFICATION FAILED — review the checklist and retry',
        ])
      }
      setRunning(false)
      timeoutRef.current = null
    }, 900)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lesson metadata header */}
      <header className="rounded-2xl border border-white/5 bg-neutral-900/40 p-6 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
          {trackName} <span className="text-muted-foreground/50">/</span> {moduleName}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tighter text-foreground">
            {lesson.title}
          </h2>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 font-mono text-xs text-primary">
            +{lesson.points} pts
          </span>
          {isCompleted && (
            <span className="rounded-full border border-success/30 bg-success/10 px-3 py-0.5 font-mono text-xs text-success">
              Completed
            </span>
          )}
        </div>

        {/* Instructions checklist */}
        <ul className="mt-5 flex flex-col gap-2.5">
          {lesson.instructions.map((instruction, i) => {
            const done = passedChecks[i] ?? false
            return (
              <li key={instruction} className="flex items-start gap-2.5">
                {done ? (
                  <CheckSquare
                    className="mt-0.5 size-4 shrink-0 text-success"
                    aria-hidden="true"
                  />
                ) : (
                  <Square
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    'text-sm leading-relaxed',
                    done ? 'text-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {instruction}
                </span>
              </li>
            )
          })}
        </ul>
      </header>

      {/* Code editor */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a10] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-destructive/60" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-primary/40" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-success/60" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {lesson.id}.workspace
          </span>
        </div>
        <div className="relative">
          <label htmlFor="code-editor" className="sr-only">
            Lesson code editor
          </label>
          <textarea
            id="code-editor"
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            spellCheck={false}
            className="h-72 w-full resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-[oklch(0.9_0.05_195)] caret-primary outline-none placeholder:text-muted-foreground/40"
          />
          <span
            aria-hidden="true"
            className="animate-zenith-caret pointer-events-none absolute bottom-4 right-4 font-mono text-primary"
          >
            ▊
          </span>
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        onClick={runVerification}
        disabled={running}
        aria-busy={running}
        className="group inline-flex items-center justify-center gap-2 self-start rounded-md rounded-tr-3xl bg-primary px-6 py-3 text-sm font-medium tracking-tight text-primary-foreground shadow-[0_0_28px_-8px_var(--color-primary)] transition-all hover:shadow-[0_0_44px_-8px_var(--color-primary)] active:scale-[0.98] disabled:opacity-60"
      >
        <Play className="size-4" aria-hidden="true" />
        {running ? 'Verifying…' : 'Run Verification Engine'}
      </button>

      {/* Terminal output */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#050508] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
          <TerminalSquare className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-mono text-xs text-muted-foreground">
            verification output
          </span>
        </div>
        <div
          role="log"
          aria-live="polite"
          className="min-h-36 p-5 font-mono text-sm leading-relaxed"
        >
          {terminalLines.map((line, i) => (
            <p
              key={`${i}-${line}`}
              className={cn(
                line.startsWith('VERIFICATION PASSED')
                  ? 'text-success'
                  : line.startsWith('VERIFICATION FAILED') ||
                      line.startsWith('ASSERTION FAILED')
                    ? 'text-destructive'
                    : line.startsWith('>')
                      ? 'text-primary'
                      : 'text-muted-foreground',
              )}
            >
              {line || '\u00A0'}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
