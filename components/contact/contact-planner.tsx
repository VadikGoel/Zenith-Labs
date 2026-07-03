'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Rocket, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const budgetStops = [5, 15, 30, 50, 75, 100] as const

const serviceTiers = [
  {
    name: 'Launch Sprint',
    range: [5, 15] as const,
    price: '$5k – $15k',
    items: ['Landing experience', 'Single AI feature', '2-week sprint'],
  },
  {
    name: 'Product Build',
    range: [15, 50] as const,
    price: '$15k – $50k',
    items: ['Full product frontend', 'Agent integration', 'Eval baseline'],
  },
  {
    name: 'Autonomous Platform',
    range: [50, 100] as const,
    price: '$50k – $100k+',
    items: ['Multi-agent systems', 'NIM inference pipeline', 'Dedicated squad'],
  },
]

function formatBudget(value: number) {
  return value >= 100 ? '$100k+' : `$${value}k`
}

export function ContactPlanner() {
  const [budget, setBudget] = useState(30)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  const inputClasses =
    'w-full rounded-xl border border-white/10 bg-[#060608]/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_20px_-8px_var(--color-primary)]'

  return (
    <div className="grid gap-8 lg:grid-cols-[7fr_5fr]">
      {/* Glassmorphism form card */}
      <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-7 shadow-2xl backdrop-blur-md lg:p-10">
        {submitted ? (
          <div className="flex h-full min-h-96 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
            <h2 className="text-2xl font-semibold tracking-tighter">
              Transmission received
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
              Our engineering leads will review your brief and respond within
              one business day.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tighter">
                Project Planner
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tell us what you&apos;re building and we&apos;ll scope the
                system with you.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm tracking-tight text-foreground/85">
                  Full name
                </label>
                <input id="name" name="name" required placeholder="Ada Lovelace" className={inputClasses} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm tracking-tight text-foreground/85">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ada@company.com"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="company" className="text-sm tracking-tight text-foreground/85">
                Company
              </label>
              <input id="company" name="company" placeholder="Company, Inc." className={inputClasses} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="brief" className="text-sm tracking-tight text-foreground/85">
                Project brief
              </label>
              <textarea
                id="brief"
                name="brief"
                rows={4}
                required
                placeholder="We need an autonomous agent that..."
                className={cn(inputClasses, 'resize-none')}
              />
            </div>

            {/* Budget range slider */}
            <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#060608]/50 p-5">
              <div className="flex items-center justify-between">
                <label htmlFor="budget" className="text-sm tracking-tight text-foreground/85">
                  Budget range
                </label>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-sm font-semibold text-primary">
                  {formatBudget(budget)}
                </span>
              </div>
              <input
                id="budget"
                type="range"
                min={5}
                max={100}
                step={5}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                aria-valuetext={formatBudget(budget)}
                className="h-1.5 w-full cursor-grab appearance-none rounded-full bg-white/10 accent-[oklch(0.85_0.14_195)] active:cursor-grabbing"
              />
              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                {budgetStops.map((stop) => (
                  <span key={stop}>{formatBudget(stop)}</span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="group mt-1 inline-flex items-center justify-center gap-2 self-start rounded-md rounded-tr-3xl bg-primary px-7 py-3.5 text-sm font-medium tracking-tight text-primary-foreground shadow-[0_0_32px_-8px_var(--color-primary)] transition-all hover:shadow-[0_0_48px_-8px_var(--color-primary)] active:scale-[0.98]"
            >
              <Send className="size-4" aria-hidden="true" />
              Transmit Brief
            </button>
          </form>
        )}
      </div>

      {/* Illuminated service tiers */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <p className="px-1 font-mono text-xs uppercase tracking-tight text-muted-foreground">
          Matching engagement tier
        </p>
        {serviceTiers.map((tier) => {
          const isMatch = budget >= tier.range[0] && budget <= tier.range[1]
          return (
            <div
              key={tier.name}
              className={cn(
                'rounded-2xl border p-6 transition-all duration-300 backdrop-blur-md',
                isMatch
                  ? 'border-primary/50 bg-primary/10 shadow-[0_0_36px_-10px_var(--color-primary)]'
                  : 'border-white/5 bg-neutral-900/40 opacity-50',
              )}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    'text-lg font-semibold tracking-tighter',
                    isMatch ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {tier.name}
                </h3>
                {isMatch && (
                  <Rocket className="size-4 text-primary" aria-hidden="true" />
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {tier.price}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-1 rounded-full',
                        isMatch ? 'bg-primary' : 'bg-muted-foreground/40',
                      )}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
