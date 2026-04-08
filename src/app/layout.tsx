import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'ShareSaathi — Invest in India\'s Next Big Companies',
  description: 'Buy and sell shares of unlisted and pre-IPO Indian companies before they list on NSE/BSE. Access Swiggy, NSDL, HDB Financial and more with ShareSaathi.',
  icons: {
    icon: [
      { url: '/assets/images/app_logo.png', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var stored = JSON.parse(localStorage.getItem('sharesaathi-storage') || '{}');
              var theme = stored.state && stored.state.theme;
              if (theme === 'midnight') {
                document.documentElement.classList.add('dark', 'theme-midnight');
              } else if (theme === 'ocean' || theme === 'forest' || theme === 'royal') {
                document.documentElement.classList.add('theme-' + theme);
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
