import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'
import './theme.css'

const _geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: {
    default: 'Zenith Labs — AI-Powered Digital Engineering Studio',
    template: '%s — Zenith Labs',
  },
  description:
    'Zenith Labs is an AI-powered digital engineering studio connecting generative AI infrastructure to high-quality consumer experiences.',
  applicationName: 'Zenith Labs',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#060608',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${_geistSans.variable} ${_geistMono.variable}`}
    >
      <body className="min-h-svh font-sans antialiased">
        <SiteHeader />
        <main className="pt-16">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
