'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import {
  Bot,
  Cpu,
  Layers,
  LineChart,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type BentoCardProps = {
  className?: string
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  glow: 'primary' | 'accent'
}

function BentoCard({
  className,
  icon,
  eyebrow,
  title,
  description,
  glow,
}: BentoCardProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [hovered, setHovered] = useState(false)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const glowColor = glow === 'primary' ? 'var(--color-primary)' : 'var(--color-accent)'

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-900/40 p-7 shadow-2xl backdrop-blur-md transition-all duration-300 lg:p-8',
        glow === 'primary'
          ? 'hover:border-primary/30'
          : 'hover:border-accent/40',
        className,
      )}
      style={{
        boxShadow: hovered
          ? `${(pos.x - 50) / -6}px ${(pos.y - 50) / -6}px 48px -18px ${glowColor}`
          : undefined,
      }}
    >
      {/* Cursor-tracked internal spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(28rem circle at ${pos.x}% ${pos.y}%, color-mix(in oklch, ${glowColor} 8%, transparent), transparent 55%)`,
        }}
      />
      <div className="relative flex h-full flex-col">
        <div
          className={cn(
            'mb-6 flex size-11 items-center justify-center rounded-xl border',
            glow === 'primary'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-accent/40 bg-accent/15 text-accent-foreground',
          )}
        >
          {icon}
        </div>
        <p className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tighter text-foreground lg:text-2xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
    </div>
  )
}

export function BentoGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-10 lg:pb-36">
      <div className="mb-14 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-tight text-primary">
          Capability Matrix
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tighter text-balance md:text-5xl">
          Systems built to think, interfaces built to seduce
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <BentoCard
          className="md:col-span-4 min-h-64"
          icon={<Bot className="size-5" />}
          eyebrow="Autonomous Agents"
          title="Custom agent deployments"
          glow="primary"
          description="Multi-step reasoning agents wired into your stack — tool calling, memory, guardrails, and observability included from day zero."
        />
        <BentoCard
          className="md:col-span-2 min-h-64"
          icon={<Sparkles className="size-5" />}
          eyebrow="Interface Craft"
          title="High-end frontend design"
          glow="accent"
          description="Interfaces engineered to the pixel. Motion, depth, and typography treated as load-bearing infrastructure."
        />
        <BentoCard
          className="md:col-span-2 min-h-60"
          icon={<Cpu className="size-5" />}
          eyebrow="Inference"
          title="NVIDIA NIM pipelines"
          glow="accent"
          description="Self-hosted NIM microservices tuned for latency budgets your users will never notice."
        />
        <BentoCard
          className="md:col-span-2 min-h-60"
          icon={<Workflow className="size-5" />}
          eyebrow="Orchestration"
          title="Durable workflows"
          glow="primary"
          description="Resumable, fault-tolerant pipelines that survive restarts and coordinate long-running AI work."
        />
        <BentoCard
          className="md:col-span-2 min-h-60"
          icon={<LineChart className="size-5" />}
          eyebrow="Evaluation"
          title="Continuous evals"
          glow="primary"
          description="Regression-proof model behavior with automated eval suites gating every deployment."
        />
        <BentoCard
          className="md:col-span-6 min-h-52"
          icon={<Layers className="size-5" />}
          eyebrow="Full Stack"
          title="From weights to WOW"
          glow="primary"
          description="One studio, the whole surface — model selection, fine-tuning, RAG architecture, edge deployment, and the consumer experience layered on top. No hand-offs, no seams."
        />
      </div>
    </section>
  )
}
