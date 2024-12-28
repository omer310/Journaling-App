'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`${
        isActive
          ? 'border-primary-500 text-primary-900 dark:text-primary-100'
          : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:border-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-300'
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
    >
      {children}
    </Link>
  );
} 