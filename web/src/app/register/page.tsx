'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SocialAuth } from '@/components/SocialAuth';
import Link from 'next/link';
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine, RiArrowRightLine, RiCheckLine } from 'react-icons/ri';

const getErrorMessage = (error: any) => {
  if (error.message) {
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists.';
    }
    if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (error.message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
  }
  return 'Failed to create account. Please try again.';
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Too short' };
    if (password.length < 8) return { strength: 2, label: 'Fair' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 4, label: 'Strong' };
    }
    return { strength: 3, label: 'Good' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/journal');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Main card */}
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-white">J</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="mt-2 text-secondary">Start your journaling journey today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RiMailLine className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RiLockLine className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="h-5 w-5" />
                  ) : (
                    <RiEyeLine className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.strength === 1 ? 'w-1/4 bg-red-500' :
                          passwordStrength.strength === 2 ? 'w-2/4 bg-yellow-500' :
                          passwordStrength.strength === 3 ? 'w-3/4 bg-blue-500' :
                          passwordStrength.strength === 4 ? 'w-full bg-green-500' : 'w-0'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength === 1 ? 'text-red-500' :
                      passwordStrength.strength === 2 ? 'text-yellow-500' :
                      passwordStrength.strength === 3 ? 'text-blue-500' :
                      passwordStrength.strength === 4 ? 'text-green-500' : ''
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RiLockLine className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-text-primary transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine className="h-5 w-5" />
                  ) : (
                    <RiEyeLine className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password match indicator */}
              {confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {password === confirmPassword ? (
                    <>
                      <RiCheckLine className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-red-500">Passwords don't match</span>
                  )}
                </div>
              )}
            </div>

            {/* Create account button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-3.5 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <RiArrowRightLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Social auth */}
          <div className="mt-8">
            <SocialAuth />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-primary hover:text-primary-light font-medium transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center mt-6">
          <p className="text-xs text-text-muted">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
} 