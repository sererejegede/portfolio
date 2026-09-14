import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Vollkorn } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from "next-themes";
import Navbar from '@/components/Navbar';

/**
 * The two faces the shipped Tailor's Ledger app uses, for the project demo.
 * Self-hosted through next/font rather than a Google Fonts <link>, so they cost
 * no extra connection and no render-blocking stylesheet — the demo must not
 * regress LCP (demo brief §8). Only the weights the app actually loads.
 */
const vollkorn = Vollkorn({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-vollkorn',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Serere Jegede',
  description: 'A professional portfolio for Serere Jegede.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${vollkorn.variable} ${plusJakartaSans.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Navbar />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
