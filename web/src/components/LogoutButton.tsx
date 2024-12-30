'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from './AuthProvider';
import { RiLogoutBoxLine } from 'react-icons/ri';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-lg bg-surface text-secondary hover:text-primary"
      title="Sign out"
    >
      <RiLogoutBoxLine className="w-5 h-5" />
    </button>
  );
} 