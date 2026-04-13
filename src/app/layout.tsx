import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ChainIntel — The Bloomberg Terminal for Crypto',
  description: 'Professional-grade digital asset intelligence. 89 data sources. On-chain analytics, ETF flows, whale tracking, AI synthesis. From $0/mo.',
  openGraph: {
    title: 'ChainIntel — The Bloomberg Terminal for Crypto',
    description: '89 data sources. On-chain analytics, DeFi TVL, whale tracking, ETF flows, AI synthesis. Bloomberg: $31,980/yr. ChainIntel: Free.',
    url: 'https://chainintelterminal.com',
    siteName: 'ChainIntel Terminal',
    images: [{ url: 'https://chainintelterminal.com/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChainIntel — The Bloomberg Terminal for Crypto',
    description: '89 data sources. On-chain analytics, DeFi TVL, whale tracking, ETF flows, AI synthesis. Bloomberg: $31,980/yr. ChainIntel: Free.',
    images: ['https://chainintelterminal.com/og-image.png'],
    creator: '@ChainIntelHQ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
