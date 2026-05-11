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
    default: 'Uni-Connect — AI-Powered University Achievement Platform',
    template: '%s | Uni-Connect',
  },
  description:
    'Final Year Project by Aditya Singh Rajput. An AI-powered student achievement and university engagement platform — manage achievements, build verified portfolios, and get personalized career guidance.',
  keywords: ['university', 'student', 'achievements', 'portfolio', 'AI', 'education', 'final year project', 'Aditya Singh Rajput'],
  authors: [{ name: 'Aditya Singh Rajput' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://uniconnect.vercel.app',
    title: 'Uni-Connect — AI-Powered University Achievement Platform',
    description: 'Final Year Project by Aditya Singh Rajput. AI-powered student achievement and university engagement platform.',
    siteName: 'Uni-Connect',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Uni-Connect | Final Year Project — Aditya Singh Rajput',
    description: 'AI-powered student achievement and university engagement platform.',
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
