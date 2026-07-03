'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/academy', label: 'Academy' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-primary/15 bg-[#060608]/60 shadow-[0_1px_12px_-4px_var(--color-primary)] backdrop-blur-md">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-sm font-bold text-primary"
            >
              Z
            </span>
            <span className="text-sm font-semibold tracking-tighter text-foreground">
              Zenith Labs
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'text-sm tracking-tight transition-colors hover:text-foreground',
                    pathname === link.href
                      ? 'text-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Asymmetrical neon action button */}
          <div className="hidden md:block">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-md rounded-tr-3xl border border-primary/50 bg-primary/10 py-2 pl-4 pr-3 text-sm font-medium tracking-tight text-primary shadow-[0_0_16px_-4px_var(--color-primary)] transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_28px_-4px_var(--color-primary)]"
            >
              Start a Build
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
          >
            {open ? <Menu className="hidden" /> : null}
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-white/5 bg-[#060608]/90 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm tracking-tight transition-colors',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="mt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-md rounded-tr-3xl border border-primary/50 bg-primary/10 py-2.5 text-sm font-medium tracking-tight text-primary"
              >
                Start a Build
                <ArrowUpRight className="size-4" />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
