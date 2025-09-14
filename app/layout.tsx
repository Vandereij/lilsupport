import Nav from "@/components/Nav";
import "./globals.css";
import { Inter, Manrope } from "next/font/google";
import Link from 'next/link'
import Image from 'next/image'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = { title: "LilSupport" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        {/* Top bar */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-6 md:py-7 px-6 md:px-2">
          <div className="flex items-center gap-3">
            {/* Replace with your SVG/logo */}

            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo-bw.svg" width={200} height={30} alt="LilSupport Brand Logo" />
              {/* <Image src="/logo.svg" width={120} height={30} alt="LilSupport" /> */}
            </Link>
          </div>
          <Nav />
        </header>

        {/* Big rounded app shell */}
        <main className="px-6 md:px-8 pb-12">
          <div className="card max-w-6xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </main>

        {/* Footer icons */}
        <footer className="max-w-6xl mx-auto px-6 md:px-2 pb-8 flex items-center justify-end gap-3">
          <a className="icon-btn text-primary-900" aria-label="Instagram" href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm6.5-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" /></svg></a>
          <a className="icon-btn text-primary-900" aria-label="Twitter/X" href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 2.5 13.9 13.1l7.2 8.4h-3.6l-5.4-6.4-6.1 6.4H2.5l8.1-8.6L3.9 2.5h3.6l5 5.9 5.6-5.9h3.4z" /></svg></a>
          <a className="icon-btn text-primary-900" aria-label="TikTok" href="#"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8.5a7.5 7.5 0 0 1-5.2-2.1V17a5.9 5.9 0 1 1-5.9-5.9 6 6 0 0 1 1.7.26V9.1a9.3 9.3 0 0 0-1.7-.16A7.9 7.9 0 1 0 21 16V8.5z" /></svg></a>
        </footer>
      </body>
    </html>
  );
}
