import Nav from '@/components/Nav'
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })

export const metadata: Metadata = {
  title: 'LilSupport — Support people you love',
  description: 'Tips and $4/mo subs for creators. Payouts via Stripe Connect.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="font-sans bg-brand-light text-brand-dark">
        <Nav />
        {children}
      </body>
    </html>
  )
}
