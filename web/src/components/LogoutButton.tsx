'use client';

import { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { RiLogoutBoxLine } from 'react-icons/ri';

export default function LogoutButton() {
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_initiated' }),
      }).catch(() => undefined);

      await signOut({ redirectUrl: '/login' });
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="p-2 rounded-lg bg-surface text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      title="Sign out"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <RiLogoutBoxLine className="w-5 h-5" />
      )}
    </button>
  );
}
