'use client';

import { useState, useEffect } from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { useStore } from '@/store/useStore';
import { getCurrentTimestamp } from '@/lib/dateUtils';
import {
  RiCloseLine,
  RiSave3Line,
} from 'react-icons/ri';

interface FloatingComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: any) => Promise<void>;
}

export function FloatingComposer({ isOpen, onClose, onSave }: FloatingComposerProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'neutral' | 'sad' | undefined>();
  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { tags, addTag, removeTag } = useStore();

  // Calculate word count
  useEffect(() => {
    // Remove HTML tags iteratively to handle nested tags properly
    // Example: "<sc<script>ript>alert(1)</script></script>" should be fully removed
    let text = content;
    let previous: string;
    do {
      previous = text;
      text = text.replace(/<[^>]*>/g, '');
    } while (text !== previous);
    
    const words = text.split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset form when composer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setSelectedTags([]);
      setSelectedMood(undefined);
      setSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const entry = {
        title: title.trim(),
        content: content.trim(),
        date: getCurrentTimestamp(),
        tags: selectedTags,
        mood: selectedMood,
        font_family: typeof window !== 'undefined' ? localStorage.getItem('soul-pages-font') || 'Indie Flower' : 'Indie Flower',
      };
      
      await onSave(entry);
      onClose();
    } catch (error) {
      console.error('Failed to save entry:', error);
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">New Entry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            aria-label="Close composer"
          >
            <RiCloseLine className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title..."
              className="w-full p-3 text-xl font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary text-text-primary placeholder-text-secondary"
              autoFocus
            />

            {/* Tags */}
            <Tags
              selectedTags={selectedTags}
              availableTags={tags}
              onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
              onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
              onTagDelete={(tagId) => removeTag(tagId)}
              onTagCreate={handleCreateTag}
            />

            {/* Mood selector */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-text-primary">How are you feeling?</label>
              <div className="flex gap-4 pt-2">
                {([
                  { emoji: '😊', value: 'happy' },
                  { emoji: '😐', value: 'neutral' },
                  { emoji: '😢', value: 'sad' }
                ] as const).map(({ emoji, value }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mood"
                      value={value}
                      checked={selectedMood === value}
                      onChange={() => setSelectedMood(value)}
                      className="sr-only"
                    />
                    <div className={`px-4 py-2 rounded-full border-2 transition-all ${
                      selectedMood === value
                        ? 'border-primary bg-primary/10 text-primary transform scale-110'
                        : 'border-border text-text-secondary hover:border-primary/50'
                    }`}>
                      <span className="text-2xl">{emoji}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Word count and date */}
            <div className="flex items-center justify-between text-sm text-text-secondary pb-2 border-b border-border">
              <div className="flex items-center gap-4">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              {wordCount > 100 && (
                <span className="text-primary font-medium">Great progress!</span>
              )}
            </div>

            {/* Rich text editor */}
            <div className="min-h-[400px]">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your thoughts..."
                fontFamily={typeof window !== 'undefined' ? localStorage.getItem('soul-pages-font') || 'Indie Flower' : 'Indie Flower'}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RiSave3Line className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
