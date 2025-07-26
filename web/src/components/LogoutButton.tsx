'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RiLogoutBoxLine } from 'react-icons/ri';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) {
      return; // Prevent multiple clicks
    }

    try {
      setLoading(true);
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
      
      // Force a hard redirect to login page to ensure clean state
      window.location.href = '/login';
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