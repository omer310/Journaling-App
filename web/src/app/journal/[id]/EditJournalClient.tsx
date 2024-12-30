'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/components/AuthProvider';
import { onSnapshot, doc, getFirestore } from 'firebase/firestore';

interface EditJournalClientProps {
  params: {
    id: string;
  };
}

const db = getFirestore();

export function EditJournalClient({ params }: EditJournalClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const { tags, entries, updateEntry, addTag } = useStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!auth.currentUser) {
      router.push('/login');
      return;
    }

    console.log('Current entries:', entries);
    console.log('Looking for entry with ID:', params.id);

    // First try to find the entry in the store
    const entry = entries.find((e) => e.id === params.id);
    if (entry) {
      console.log('Found entry in store:', entry);
      setTitle(entry.title);
      setContent(entry.content);
      setSelectedTags(entry.tags || []);
      setLoading(false);
      return;
    }

    // If not found in store, try to fetch directly from Firestore
    const unsubscribe = onSnapshot(
      doc(db, 'journal_entries', params.id),
      (doc) => {
        if (doc.exists()) {
          console.log('Found entry in Firestore:', doc.data());
          const data = doc.data();
          setTitle(data.title || '');
          setContent(data.content || '');
          setSelectedTags(data.tags || []);
          setLoading(false);
        } else {
          console.log('Entry not found in Firestore');
          if (retryCount < 3) {
            // Retry a few times before showing error
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000);
          } else {
            setError('Entry not found. Please try again.');
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error('Error fetching entry:', error);
        setError('Failed to load entry. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [entries, params.id, router, retryCount]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await updateEntry(params.id, {
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-2xl text-red-500">{error}</div>
        <button
          onClick={() => router.push('/entries')}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Back to Entries
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-surface rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Entry Title"
                className="w-full text-3xl font-bold border-none focus:outline-none focus:ring-0 bg-transparent placeholder-text-secondary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="text-sm text-secondary mt-2">
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="mb-6">
              <Tags
                selectedTags={selectedTags}
                availableTags={tags}
                onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                onTagRemove={(tagId) =>
                  setSelectedTags(selectedTags.filter((id) => id !== tagId))
                }
                onTagCreate={handleCreateTag}
              />
            </div>

            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your thoughts here..."
              autosave
            />

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => router.push('/entries')}
                className="px-6 py-2 bg-surface-hover text-secondary rounded-lg hover:bg-border transition-colors duration-200"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 