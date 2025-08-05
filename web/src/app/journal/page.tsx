"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Tags } from '@/components/Tags';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { getCurrentTimestamp } from '@/lib/dateUtils';
import {
  RiSave3Line,
  RiFireLine,
  RiFireFill,
  RiTimeLine,
  RiEmotionHappyLine,
  RiEmotionNormalLine,
  RiEmotionSadLine,
} from 'react-icons/ri';

export default function EnhancedJournalPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<'happy' | 'neutral' | 'sad' | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { tags, addEntry, addTag, removeTag, entries } = useStore();

  // Custom flame component with smooth color progression
  const CustomFlame = ({ size = 'medium', streak = 0 }: { size?: 'small' | 'medium' | 'large', streak?: number }) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4', 
      large: 'w-5 h-5'
    };
    
    // Smooth color progression: Red → Orange → Yellow → Green → Blue → Purple
    // Streak range: 0-100 days (can be extended)
    const getFlameColors = (streak: number) => {
      // Normalize streak to 0-1 range (0-100 days)
      const normalized = Math.min(streak / 100, 1);
      
      // Color progression: Red → Orange → Yellow → Green → Blue → Purple
      const colors = [
        { base: '#ff1100', left: '#ff3300', center: '#ff5500', right: '#ff7700', glow: '#ffff00' }, // Red
        { base: '#ff5500', left: '#ff7700', center: '#ff9900', right: '#ffbb00', glow: '#ffff44' }, // Orange
        { base: '#ff9900', left: '#ffbb00', center: '#ffdd00', right: '#ffff00', glow: '#ffff88' }, // Yellow
        { base: '#00aa00', left: '#00cc00', center: '#00ee00', right: '#44ff44', glow: '#88ff88' }, // Green
        { base: '#0040ff', left: '#0060ff', center: '#0080ff', right: '#40a0ff', glow: '#80c0ff' }, // Blue
        { base: '#4a148c', left: '#6a1b9a', center: '#8e24aa', right: '#ab47bc', glow: '#f3e5f5' }  // Purple
      ];
      
      // Calculate which color segment we're in
      const segment = normalized * (colors.length - 1);
      const index = Math.floor(segment);
      const fraction = segment - index;
      
      // Interpolate between colors
      const current = colors[index];
      const next = colors[Math.min(index + 1, colors.length - 1)];
      
      const interpolateColor = (color1: string, color2: string, frac: number) => {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 + (r2 - r1) * frac);
        const g = Math.round(g1 + (g2 - g1) * frac);
        const b = Math.round(b1 + (b2 - b1) * frac);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      };
      
      return {
        base: interpolateColor(current.base, next.base, fraction),
        left: interpolateColor(current.left, next.left, fraction),
        center: interpolateColor(current.center, next.center, fraction),
        right: interpolateColor(current.right, next.right, fraction),
        glow: interpolateColor(current.glow, next.glow, fraction)
      };
    };
    
    const colors = getFlameColors(streak);
    
    return (
      <div className={`flame-container ${sizeClasses[size]}`}>
        <div 
          className="flame-base"
          style={{ background: `linear-gradient(to top, ${colors.base} 0%, ${colors.left} 50%, ${colors.center} 100%)` }}
        ></div>
        <div 
          className="flame-left"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 30%, ${colors.right} 60%, ${colors.glow} 85%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-center"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 25%, ${colors.right} 50%, ${colors.glow} 75%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-right"
          style={{ background: `linear-gradient(to top, ${colors.left} 0%, ${colors.center} 35%, ${colors.right} 65%, ${colors.glow} 90%, #ffffff 100%)` }}
        ></div>
        <div 
          className="flame-glow"
          style={{ background: `linear-gradient(to top, ${colors.glow} 0%, #ffffff 60%, rgba(255, 255, 255, 0.9) 100%)` }}
        ></div>
      </div>
    );
  };

  // Animated streak display functions
  const getStreakIcon = (streak: number) => {
    return <CustomFlame size="medium" streak={streak} />; // 🔥 Consistent size, color changes with streak
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-primary bg-primary/20 border-primary/30"; // App primary for long streaks
    if (streak >= 7) return "text-primary bg-primary/15 border-primary/25"; // App primary for week+
    return "text-primary bg-primary/10 border-primary/20"; // App primary for short streaks
  };

  const getStreakText = (streak: number) => {
    if (streak >= 365) return `${Math.floor(streak/365)} year streak`;
    if (streak >= 30) return `${Math.floor(streak/30)} month streak`;
    if (streak >= 7) return `${Math.floor(streak/7)} week streak`;
    return `${streak} day streak`;
  };

  const getStreakSize = (streak: number) => {
    if (streak >= 30) return "px-4 py-2 text-base"; // Bigger for long streaks
    if (streak >= 7) return "px-3 py-1.5 text-sm";  // Medium for week+
    return "px-3 py-1 text-sm";                      // Normal for short streaks
  };

  // Calculate word count
  useEffect(() => {
    const text = content.replace(/<[^>]*>/g, ''); // Strip HTML
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

  // Calculate writing streak
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    while (true) {
      const hasEntry = sortedEntries.some(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === checkDate.getTime();
      });
      
      if (hasEntry || checkDate.getTime() === today.getTime()) {
        if (hasEntry) currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [entries]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication error');
      }

      await addEntry({
        title: title.trim(),
        content: content.trim(),
        date: getCurrentTimestamp(),
        tags: selectedTags,
        mood: selectedMood,
        font_family: typeof window !== 'undefined' ? localStorage.getItem('soul-pages-font') || 'Indie Flower' : 'Indie Flower',
      } as any);

      router.prefetch('/entries');
      setTimeout(() => {
        router.push('/entries');
      }, 100);

    } catch (error: any) {
      console.error('Failed to save entry:', error);
      setError(error.message || 'Failed to save entry. Please try again.');
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
            {/* Header with title and save button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-primary">New Entry</h1>
                {streak > 0 && (
                  <div 
                    className={`flex items-center gap-2 rounded-full border transition-all duration-500 ease-in-out transform hover:scale-105 ${getStreakColor(streak)} ${getStreakSize(streak)}`}
                    style={{
                      animation: streak >= 30 ? 'glow 2s ease-in-out infinite alternate' : 'none'
                    }}
                  >
                    {getStreakIcon(streak)}
                    <span className="font-medium">{getStreakText(streak)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/entries')}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || !content.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Main writing area */}
            <div className="space-y-4">
              {/* Title input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title..."
                className="w-full p-3 text-xl font-semibold bg-transparent border-b border-border focus:outline-none focus:border-primary text-text-primary placeholder-text-secondary"
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
