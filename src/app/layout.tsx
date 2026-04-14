import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  title: 'ChainIntel — The Bloomberg Terminal for Digital Assets',
  description: 'Professional-grade digital asset intelligence. Live CoinMarketCap prices, on-chain analytics, ETF flows, whale tracking, AI synthesis. Bloomberg: $31,980/yr. ChainIntel: Free.',
  metadataBase: new URL('https://chainintelterminal.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'ChainIntel — The Bloomberg Terminal for Digital Assets',
    description: 'Live CoinMarketCap prices, on-chain analytics, DeFi TVL, whale tracking, ETF flows, AI synthesis. Bloomberg: $31,980/yr. ChainIntel: Free.',
    url: 'https://chainintelterminal.com',
    siteName: 'ChainIntel Terminal',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ChainIntel Terminal — Digital Asset Intelligence Platform' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChainIntel — The Bloomberg Terminal for Digital Assets',
    description: 'Live CoinMarketCap prices, on-chain analytics, DeFi TVL, whale tracking, ETF flows, AI synthesis. Bloomberg: $31,980/yr. ChainIntel: Free.',
    images: ['/og-image.png'],
    creator: '@ChainIntelHQ',
  },
  keywords: ['crypto terminal', 'blockchain analytics', 'bitcoin', 'digital assets', 'DeFi', 'ETF flows', 'on-chain analytics', 'crypto intelligence', 'market data'],
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
