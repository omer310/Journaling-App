'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import ProtectedRoute from '@/components/ProtectedRoute';

interface EditJournalPageProps {
  params: {
    id: string;
  };
}

export default function EditJournalPage({ params }: EditJournalPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const { tags, entries, updateEntry, addTag } = useStore();

  useEffect(() => {
    const entry = entries.find((e) => e.id === params.id);
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setSelectedTags(entry.tags);
      setLoading(false);
    } else {
      router.push('/entries');
    }
  }, [entries, params.id, router]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      updateEntry(params.id, {
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
      });

      router.push('/entries');
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
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