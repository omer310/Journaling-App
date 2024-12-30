'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useStore } from '@/store/useStore';
import { useEffect } from 'react';
import { RiSunLine, RiMoonLine, RiWifiOffLine } from 'react-icons/ri';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import LogoutButton from '@/components/LogoutButton';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentTheme, setTheme, isOffline, setOfflineStatus } = useStore();
  const { user } = useAuth();

  useEffect(() => {
    // Theme setup
    const root = document.documentElement;
    
    // Set initial theme
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else if (currentTheme === 'light') {
      root.classList.remove('dark');
    } else if (currentTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      systemDark ? root.classList.add('dark') : root.classList.remove('dark');
    }

    // Handle system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (currentTheme === 'system') {
        e.matches ? root.classList.add('dark') : root.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [currentTheme]);

  useEffect(() => {
    // Offline detection
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return (
    <>
      <Head>
        <title>Soul Pages - Your Personal Journal</title>
        <meta
          name="description"
          content="A secure and private journaling application"
        />
      </Head>
      <div className={inter.className}>
        <nav className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/"
                  className="flex items-center text-2xl font-bold text-primary"
                >
                  Soul Pages
                </Link>
                {user && (
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      href="/journal"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-secondary hover:text-primary"
                    >
                      Write
                    </Link>
                    <Link
                      href="/entries"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-secondary hover:text-primary"
                    >
                      Entries
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {isOffline && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <RiWifiOffLine className="w-5 h-5" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    setTheme(newTheme);
                  }}
                  className="p-2 rounded-lg bg-surface text-secondary hover:text-primary"
                  aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {currentTheme === 'dark' ? (
                    <RiSunLine className="w-5 h-5" />
                  ) : (
                    <RiMoonLine className="w-5 h-5" />
                  )}
                </button>

                {user && <LogoutButton />}
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
