'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RiLogoutBoxLine } from 'react-icons/ri';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      
      // Check current session first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.email);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }
      
      console.log('Sign out successful, redirecting to login...');
      
      // Force a hard redirect to login page
      window.location.href = '/login';
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