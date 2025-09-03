import './globals.css';
import { ReactNode } from 'react';
import TopNav from '@/components/TopNav';

export const metadata = { title: 'LilSupport', description: 'Simple supporter payments' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <TopNav />
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
