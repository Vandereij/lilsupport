import type { AppProps } from 'next/app'
import './globals.css'
import { Inter, Lora } from '@next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['400','500','600','700'] })
const spaceGrotesk = Lora({ subsets: ['latin'], variable: '--font-lora', weight: ['400','700'] })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
      <Component {...pageProps} />
    </main>
  )
}
