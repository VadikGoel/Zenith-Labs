'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const stack = [
  {
    name: 'Next.js',
    role: 'Application Runtime',
    detail: 'App Router, RSC streaming, and edge rendering as the delivery spine of every build.',
    tag: 'core',
  },
  {
    name: 'Tailwind',
    role: 'Design System',
    detail: 'Token-driven theming compiled to atomic CSS. Zero drift between design and ship.',
    tag: 'core',
  },
  {
    name: 'Framer Motion',
    role: 'Motion Layer',
    detail: 'Physics-based transitions and orchestrated gestures that make interfaces feel alive.',
    tag: 'motion',
  },
  {
    name: 'Python',
    role: 'Model Backbone',
    detail: 'Inference services, eval harnesses, and data pipelines feeding every agent we deploy.',
    tag: 'ml',
  },
]

export function StackMatrix() {
  const [active, setActive] = useState(0)

  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-6 shadow-2xl backdrop-blur-md lg:p-8">
      <p className="font-mono text-xs uppercase tracking-tight text-primary">
        Core Stack Matrix
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stack.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={active === i}
            className={cn(
              'rounded-xl border p-4 text-left transition-all duration-200',
              active === i
                ? 'border-primary/50 bg-primary/10 shadow-[0_0_24px_-8px_var(--color-primary)]'
                : 'border-white/5 bg-[#060608]/60 hover:border-accent/40',
            )}
          >
            <p
              className={cn(
                'text-sm font-semibold tracking-tighter',
                active === i ? 'text-primary' : 'text-foreground',
              )}
            >
              {item.name}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
              {item.tag}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-white/5 bg-[#060608]/60 p-5">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {stack[active].role}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          {stack[active].detail}
        </p>
      </div>
    </div>
  )
}
