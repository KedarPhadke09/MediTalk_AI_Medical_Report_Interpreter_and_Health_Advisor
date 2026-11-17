import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MediTalk — Voice-First AI Medical Report Interpreter & Health Advisor',
  description:
    'RAG-powered clinical report explainer with zero-hallucination deterministic validation, multilingual voice I/O, and longitudinal trend analytics.',
  keywords: [
    'Medical AI',
    'Report Explainer',
    'RAG',
    'pgvector',
    'Next.js 15',
    'Voice Medical AI',
    'Health Literacy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900`}
      >
        {children}
      </body>
    </html>
  );
}
