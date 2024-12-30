'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createEntry } from '@/lib/journal';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function JournalPage() {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSave = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setSaving(true);
      await createEntry(user.uid, {
        title,
        content,
      });
      
      // Clear the form after successful save
      setTitle('');
      setContent('');
      router.push('/entries');
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-primary-50 dark:bg-dark-bg">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Entry Title"
                className="w-full text-3xl font-bold border-none focus:outline-none focus:ring-0 text-primary-900 dark:text-primary-100 bg-transparent placeholder-primary-300 dark:placeholder-primary-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>
            
            <textarea
              className="w-full h-96 p-4 border border-secondary-200 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg focus:ring-primary-500 focus:border-primary-500 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400 resize-none"
              placeholder="Write your thoughts here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setContent('')}
                className="px-6 py-2 bg-secondary-100 dark:bg-dark-bg text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-dark-border transition-colors duration-200"
                disabled={saving}
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 