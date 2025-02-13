'use client';

import 'regenerator-runtime/runtime';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { MoodSelector } from '@/components/MoodSelector';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';

type Mood = 'happy' | 'neutral' | 'sad';

export default function JournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mood, setMood] = useState<Mood>();
  const [saving, setSaving] = useState(false);

  const { tags, addEntry, addTag, removeTag } = useStore();

  useEffect(() => {
    // Load draft from localStorage if exists
    const draft = localStorage.getItem('journal-draft');
    if (draft) {
      const { title: draftTitle, content: draftContent, tags: draftTags, mood: draftMood } = JSON.parse(draft);
      setTitle(draftTitle || '');
      setContent(draftContent || '');
      setSelectedTags(draftTags || []);
      setMood(draftMood);
    }
  }, []);

  // Autosave draft
  useEffect(() => {
    const draft = {
      title,
      content,
      tags: selectedTags,
      mood,
    };
    localStorage.setItem('journal-draft', JSON.stringify(draft));
  }, [title, content, selectedTags, mood]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await addEntry({
        title: title.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
        tags: selectedTags,
        mood,
      });

      // Clear draft
      localStorage.removeItem('journal-draft');
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedTags([]);
      setMood(undefined);
      
      // Navigate to entries page
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
                onTagRemove={(tagId) => {
                  setSelectedTags(selectedTags.filter((id) => id !== tagId));
                  removeTag(tagId);
                }}
                onTagCreate={handleCreateTag}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary mb-2">
                How are you feeling?
              </label>
              <MoodSelector value={mood} onChange={setMood} />
            </div>

            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your thoughts here..."
              autosave
            />

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setSelectedTags([]);
                  setMood(undefined);
                  localStorage.removeItem('journal-draft');
                }}
                className="px-6 py-2 bg-surface-hover text-secondary rounded-lg hover:bg-border transition-colors duration-200"
                disabled={saving}
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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