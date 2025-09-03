import './globals.css'
import { ReactNode } from 'react'


export const metadata = {
    title: 'LilSupport',
    description: 'Support creators with one-time or $4/mo tips'
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-neutral-50 text-neutral-900">
                <div className="max-w-5xl mx-auto p-4">{children}</div>
            </body>
        </html>
    )
}