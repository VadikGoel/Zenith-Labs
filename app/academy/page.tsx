import type { Metadata } from 'next'
import { AcademyDashboard } from '@/components/academy/academy-dashboard'

export const metadata: Metadata = {
  title: 'Academy — Zenith Labs',
  description:
    'Zenith Academy: an interactive engineering curriculum with verified lessons in C#, C++, and more.',
}

export default function AcademyPage() {
  return <AcademyDashboard />
}
