import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ThemeToggle, AuthProvider, LogoutButton } from '@/components';
import { NavLink } from '@/components/NavLink';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Personal Journal',
  description: 'A secure and private journaling application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark:bg-dark-bg dark:text-white`} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            <nav className="bg-white dark:bg-dark-card shadow-sm dark:shadow-dark-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">Journal</span>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      <NavLink href="/journal">Write</NavLink>
                      <NavLink href="/entries">Entries</NavLink>
                    </div>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                    <ThemeToggle />
                    <LogoutButton />
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
