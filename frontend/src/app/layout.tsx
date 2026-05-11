import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Uni-Connect — Your University Ecosystem',
    template: '%s | Uni-Connect',
  },
  description:
    'AI-powered student achievement and university engagement platform. Manage achievements, build portfolios, and connect your complete student journey.',
  keywords: ['university', 'student', 'achievements', 'portfolio', 'AI', 'education'],
  authors: [{ name: 'Uni-Connect Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uniconnect.edu',
    title: 'Uni-Connect — Your University Ecosystem',
    description: 'AI-powered student achievement and university engagement platform.',
    siteName: 'Uni-Connect',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uni-Connect',
    description: 'AI-powered student achievement platform',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
