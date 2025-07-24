'use client';

import { useState } from 'react';

// Disable static generation for this page since it requires authentication
// and has heavy client-side interactivity
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

export default function JournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'neutral' | 'sad' | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { tags, addEntry, addTag } = useStore();

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // First, let's check if the user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.id);

      await addEntry({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        tags: selectedTags,
        mood: selectedMood,
      });

      router.push('/entries');
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      setError(error.message || 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTag = (tagName: string) => {
    const newTag = {
      name: tagName,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    addTag(newTag);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-primary">New Entry</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/entries')}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title..."
                className="w-full p-3 text-xl font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary"
              />

              <Tags
                selectedTags={selectedTags}
                availableTags={tags}
                onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                onTagCreate={handleCreateTag}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">How are you feeling?</label>
                <div className="flex gap-4">
                  {(['happy', 'neutral', 'sad'] as const).map((mood) => (
                    <label key={mood} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mood"
                        value={mood}
                        checked={selectedMood === mood}
                        onChange={() => setSelectedMood(mood)}
                        className="sr-only"
                      />
                      <div className={`px-4 py-2 rounded-full border-2 transition-colors ${
                        selectedMood === mood
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your thoughts..."
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 