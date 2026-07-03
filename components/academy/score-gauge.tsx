'use client'

type ScoreGaugeProps = {
  score: number
  max: number
}

export function ScoreGauge({ score, max }: ScoreGaugeProps) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? score / max : 0
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-16">
        <svg
          viewBox="0 0 64 64"
          className="size-16 -rotate-90"
          role="img"
          aria-label={`Total marks: ${score} of ${max}`}
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="5"
            className="stroke-white/10"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            className="stroke-primary drop-shadow-[0_0_6px_var(--color-primary)] transition-all duration-700 ease-out"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-foreground">
          {score}
        </span>
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
          Total Marks
        </p>
        <p className="text-lg font-semibold tracking-tighter text-foreground">
          {score}
          <span className="text-sm text-muted-foreground"> / {max}</span>
        </p>
      </div>
    </div>
  )
}
