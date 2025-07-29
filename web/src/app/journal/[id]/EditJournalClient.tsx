'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { MoodSelector } from '@/components/MoodSelector';
import ProtectedRoute from '@/components/ProtectedRoute';

interface EditJournalClientProps {
  params: {
    id: string;
  };
}

// Helper function to safely get tags array
function getTagsArray(tags: any): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function EditJournalClient({ params }: EditJournalClientProps) {
  const router = useRouter();
  const { entries, tags, updateEntry, addTag } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState<'happy' | 'neutral' | 'sad' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // First, try to find the entry in the store
    const entry = entries.find((e) => e.id === params.id);
    if (entry) {
      console.log('Found entry in store:', entry);
      setTitle(entry.title);
      setContent(entry.content);
      setEntryDate(entry.date || '');
      setSelectedTags(getTagsArray(entry.tags));
      setMood(entry.mood);
      setLoading(false);
      return;
    }

    // If not found in store, try to fetch directly from Supabase
    const fetchEntry = async () => {
      try {
        const { data: entry, error } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error || !entry) {
          ('Entry not found in Supabase');
          if (retryCount < 3) {
            // Retry a few times before showing error
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
          } else {
            setError('Entry not found. Please try again.');
            setLoading(false);
          }
          return;
        }

        console.log('Found entry in Supabase:', entry);
        setTitle(entry.title || '');
        setContent(entry.content || '');
        setEntryDate(entry.date || '');
        setSelectedTags(getTagsArray(entry.tags));
        setMood(entry.mood);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching entry:', error);
        setError('Failed to load entry. Please try again.');
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entries, params.id, router, retryCount]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await updateEntry(params.id, {
        title: title.trim(),
        content: content.trim(),
        date: entryDate,
        tags: selectedTags,
        mood,
      });

      router.push('/entries');
    } catch (error) {
      console.error('Failed to save entry:', error);
      setError('Failed to save entry. Please try again.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-primary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-destructive mb-4">{error}</div>
          <button
            onClick={() => router.push('/entries')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Back to Entries
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-primary">Edit Journal Entry</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/entries')}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Entry Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-primary focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-calendar-picker-indicator]:bg-primary [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:hover:bg-primary/80 [&::-webkit-datetime-edit]:text-primary [&::-webkit-datetime-edit-fields-wrapper]:text-primary [&::-webkit-datetime-edit-text]:text-primary [&::-webkit-datetime-edit-month-field]:text-primary [&::-webkit-datetime-edit-day-field]:text-primary [&::-webkit-datetime-edit-year-field]:text-primary [&::-webkit-datetime-edit-hour-field]:text-primary [&::-webkit-datetime-edit-minute-field]:text-primary [&::-webkit-datetime-edit-ampm-field]:text-primary"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
                <p className="text-xs text-secondary mt-1">
                  Set the date and time when this entry was originally written
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Content
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Tags
                </label>
                <Tags
                  selectedTags={selectedTags}
                  availableTags={tags}
                  onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                  onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                  onTagCreate={handleCreateTag}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Mood
                </label>
                <MoodSelector value={mood} onChange={setMood} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 