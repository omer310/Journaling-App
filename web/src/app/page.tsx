'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/useStore';
import { Calendar } from '@/components/Calendar';
import { FilterPanel } from '@/components/FilterPanel';
import { ListLayout, GridLayout, TimelineLayout } from '@/components/EntryLayouts';
import { FloatingComposer, FloatingEditComposer, MotivationBanner, StreakWidget, LayoutSelector, Search } from '@/components';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { normalizeDateForDisplay } from '@/lib/dateUtils';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import dayjs from 'dayjs';
import {
  RiAddLine,
  RiDeleteBinLine,
} from 'react-icons/ri';

// Helper function to get tags array
const getTagsArray = (tags: any): string[] => {
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
};

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<('happy' | 'neutral' | 'sad')[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [streak, setStreak] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [layoutMode, setLayoutMode] = useState<'list' | 'grid' | 'compact' | 'timeline'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('journal-layout-mode') as 'list' | 'grid' | 'compact' | 'timeline') || 'list';
    }
    return 'list';
  });

  const { 
    entries = [], 
    entriesLoading, 
    tags = [], 
    addEntry, 
    updateEntry,
    removeEntry,
    removeMultipleEntries,
    fetchEntries,
    composerOpen,
    openComposer,
    closeComposer,
    editComposerOpen,
    editEntryId,
    openEditComposer,
    closeEditComposer
  } = useStore();

  // Save layout mode to localStorage
  useEffect(() => {
    localStorage.setItem('journal-layout-mode', layoutMode);
  }, [layoutMode]);

  // Calculate writing streak
  useEffect(() => {
    const today = new Date();
    const todayString = normalizeDateForDisplay(today.toISOString());
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    while (true) {
      const checkDateString = normalizeDateForDisplay(checkDate.toISOString());
      const hasEntry = sortedEntries.some(entry => {
        const entryDay = normalizeDateForDisplay(entry.date);
        return entryDay === checkDateString;
      });
      
      if (hasEntry || checkDateString === todayString) {
        if (hasEntry) currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  }, [entries]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch entries on mount
  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, fetchEntries]);

  // Handle authentication redirects
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSaveEntry = async (entryData: any) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication error');
      }

      await addEntry(entryData);
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      throw error;
    }
  };

  const handleSaveEditEntry = async (entryData: any) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication error');
      }

      await updateEntry(entryData.id, entryData);
    } catch (error: any) {
      console.error('Failed to save entry:', error);
      throw error;
    }
  };

  // Selection handlers
  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(entry => entry.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedEntries.length} entr${selectedEntries.length === 1 ? 'y' : 'ies'}?`)) {
      try {
        await removeMultipleEntries(selectedEntries);
        setSelectedEntries([]);
      } catch (error) {
        console.error('Failed to delete entries:', error);
        alert('Failed to delete entries. Please try again.');
      }
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await removeEntry(entryId);
        setSelectedEntries(prev => prev.filter(id => id !== entryId));
      } catch (error) {
        console.error('Failed to delete entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const handleEntryHover = (entryId: string) => {
    // Optional: Add hover effects or tooltips here
  };

  const filteredEntries = entries.filter((entry) => {
    const entryTags = getTagsArray(entry.tags);
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(query);
      const contentMatch = entry.content.toLowerCase().includes(query);
      const tagMatch = entryTags.some(tagId => {
        const tag = tags.find(t => t.id === tagId);
        return tag && tag.name.toLowerCase().includes(query);
      });
      
      if (!titleMatch && !contentMatch && !tagMatch) {
        return false;
      }
    }
    
    // Filter by tags
    if (selectedTags.length > 0 && !selectedTags.every((tagId) => entryTags.includes(tagId))) {
      return false;
    }

    // Filter by moods
    if (selectedMoods.length > 0 && (!entry.mood || !selectedMoods.includes(entry.mood))) {
      return false;
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      // Use normalized date for consistent comparison
      const entryDay = normalizeDateForDisplay(entry.date);
      
      if (dateRange.start && dateRange.end) {
        // Single date selection (start and end are the same)
        const selectedDay = dayjs(dateRange.start).format('YYYY-MM-DD');
        if (entryDay !== selectedDay) return false;
      } else if (dateRange.start) {
        const startDay = dayjs(dateRange.start).format('YYYY-MM-DD');
        if (entryDay < startDay) return false;
      } else if (dateRange.end) {
        const endDay = dayjs(dateRange.end).format('YYYY-MM-DD');
        if (entryDay > endDay) return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome to Your Journal</h1>
          <p className="text-text-secondary animate-pulse">Loading your content...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top row with motivation banner and streak */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* Motivation Banner */}
            <MotivationBanner />

            {/* Streak Widget */}
            <StreakWidget streak={streak} />
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left column: Calendar and Filters */}
            <div className="lg:col-span-1 space-y-6">
                                        {/* Calendar */}
                          <Calendar
                            entries={entries.map((entry) => ({
                              id: entry.id,
                              date: entry.date,
                              title: entry.title,
                            }))}
                            onDateSelect={(date) => {
                              // Filter to show only entries from the selected date
                              const selectedDateStr = dayjs(date).format('YYYY-MM-DD');
                              setDateRange({
                                start: selectedDateStr,
                                end: selectedDateStr
                              });
                            }}
                            onClearFilters={() => {
                              setSelectedTags([]);
                              setSelectedMoods([]);
                              setDateRange({ start: '', end: '' });
                              setSearchQuery('');
                            }}
                          />

              {/* Filters */}
              <FilterPanel
                selectedTags={selectedTags}
                availableTags={tags}
                onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                selectedMoods={selectedMoods}
                onMoodSelect={(mood) => setSelectedMoods([...selectedMoods, mood])}
                onMoodRemove={(mood) => setSelectedMoods(selectedMoods.filter(m => m !== mood))}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {/* Right column: Entries */}
            <div className="lg:col-span-3">
              {/* Layout Selector and New Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-6">
                  <h2 className="text-xl font-semibold text-text-primary">Entries</h2>
                  <Search
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search entries..."
                    className="w-80"
                  />

                </div>
                <div className="flex items-center gap-4">
                  <LayoutSelector value={layoutMode} onChange={setLayoutMode} />
                  <button
                    onClick={openComposer}
                    className="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center gap-2"
                    aria-label="Create new entry"
                  >
                    <RiAddLine className="w-4 h-4" />
                    <span className="font-medium">New</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedEntries.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-text-primary">
                      {selectedEntries.length} entr{selectedEntries.length === 1 ? 'y' : 'ies'} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-primary hover:text-primary-dark transition-colors underline"
                      >
                        {selectedEntries.length === filteredEntries.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-text-secondary">•</span>
                      <button
                        onClick={() => setSelectedEntries([])}
                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
              
              {entriesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner 
                    size="large" 
                    text="Loading your journal entries..." 
                  />
                </div>
              ) : layoutMode === 'grid' ? (
                                            <GridLayout
                              entries={filteredEntries}
                              tags={tags}
                              selectedEntries={selectedEntries}
                              onSelect={handleSelectEntry}
                              onEdit={(id) => openEditComposer(id)}
                              onDelete={handleDeleteEntry}
                            />
              ) : layoutMode === 'timeline' ? (
                                            <TimelineLayout
                              entries={filteredEntries}
                              tags={tags}
                              selectedEntries={selectedEntries}
                              onSelect={handleSelectEntry}
                              onEdit={(id) => openEditComposer(id)}
                              onDelete={handleDeleteEntry}
                            />
              ) : (
                                            <ListLayout
                              entries={filteredEntries}
                              tags={tags}
                              selectedEntries={selectedEntries}
                              onSelect={handleSelectEntry}
                              onEdit={(id) => openEditComposer(id)}
                              onDelete={handleDeleteEntry}
                              onHover={handleEntryHover}
                            />
              )}
            </div>
          </div>



                      {/* Floating Composer */}
            <FloatingComposer
              isOpen={composerOpen}
              onClose={closeComposer}
              onSave={handleSaveEntry}
            />

            {/* Floating Edit Composer */}
            <FloatingEditComposer
              isOpen={editComposerOpen}
              onClose={closeEditComposer}
              entryId={editEntryId || ''}
              onSave={handleSaveEditEntry}
            />
        </div>
      </div>
    </ProtectedRoute>
  );
}
