import type { ReactNode } from 'react'
import './globals.css'
import { QueryProvider } from '../components/query-provider'

export const metadata = {
  title: 'ShareRide Admin',
  description: 'ShareRide Super Admin console',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
