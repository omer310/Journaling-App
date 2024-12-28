'use client';

import { useAuth } from './AuthProvider';

export default function LogoutButton() {
  const { logOut } = useAuth();

  return (
    <button
      onClick={logOut}
      className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100"
    >
      Sign Out
    </button>
  );
} 