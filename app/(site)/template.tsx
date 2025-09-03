import { ReactNode } from 'react'
import { Providers } from '@/app/providers'
export default function Template({ children }: { children: ReactNode }) {
    return <>{children}<Providers /></>
}