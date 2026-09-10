import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zenith Learning — Learn anything. Understand everything. Build anything.',
  description: 'House of Elvara · by Vadik Goel. An adaptive computing and software-engineering learning platform.',
  applicationName: 'Zenith Learning',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Analytics /></body></html>;
}
