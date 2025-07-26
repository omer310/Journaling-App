'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { Search } from '@/components/Search';
import { FilterPanel } from '@/components/FilterPanel';
import { Analytics } from '@/components/Analytics';
import { ExportMenu } from '@/components/ExportMenu';
import { LayoutSelector, type LayoutMode } from '@/components/LayoutSelector';
import { ListLayout, GridLayout, CompactLayout } from '@/components/EntryLayouts';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  RiCalendarLine,
  RiBarChartLine,
  RiCheckboxBlankLine,
  RiCheckboxFill,
  RiRefreshLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import { exportToPdf, exportToMarkdown, exportToText } from '@/services/export';

type ViewMode = 'list' | 'calendar' | 'analytics';

type Mood = 'happy' | 'neutral' | 'sad';

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

export default function EntriesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const { entries = [], entriesLoading, tags = [], removeEntry, removeMultipleEntries, removeTag, searchEntries, fetchEntries, lastSyncTime } = useStore();

  // Prefetch entries when hovering over links
  const prefetchEntry = useCallback((id: string) => {
    router.prefetch(`/journal/${id}`);
  }, [router]);

  // Fetch entries when component mounts
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setError('');
        await fetchEntries();
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Error loading entries:', error);
        setError('Failed to load entries. Please try refreshing the page.');
        
        // Auto-retry up to 3 times
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
        }
      }
    };
    
    loadEntries();
  }, [fetchEntries, retryCount]);

  // Prefetch next batch of entries
  useEffect(() => {
    if (entries.length > 0) {
      // Prefetch the first few entries
      entries.slice(0, 5).forEach(entry => {
        prefetchEntry(entry.id);
      });
    }
  }, [entries, prefetchEntry]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await fetchEntries();
    } catch (error) {
      console.error('Error refreshing entries:', error);
      setError('Failed to refresh entries. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    const results = searchEntries(query);
    return results.map((entry) => ({
      ...entry,
      matchingText: entry.content.substring(0, 200),
    }));
  };

  const handleSearchResultClick = (result: { id: string }) => {
    router.push(`/journal/${result.id}`);
  };

  const filteredEntries = (entries || []).filter((entry) => {
    const entryTags = getTagsArray(entry.tags);
    
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
      const entryDate = new Date(entry.date);
      if (dateRange.start) {
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        if (entryDate < startDate) return false;
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (entryDate > endDate) return false;
      }
    }

    return true;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setDeleting(true);
      try {
        await removeEntry(id);
        setSelectedEntries(selectedEntries.filter((entryId) => entryId !== id));
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) {
      alert('No entries selected');
      return;
    }

    const confirmMessage = selectedEntries.length === 1 
      ? 'Are you sure you want to delete this entry?' 
      : `Are you sure you want to delete ${selectedEntries.length} entries?`;

    if (window.confirm(confirmMessage)) {
      setDeleting(true);
      try {
        // Delete all selected entries in a single operation
        await removeMultipleEntries(selectedEntries);
        setSelectedEntries([]);
      } catch (error) {
        console.error('Error deleting selected entries:', error);
        alert('Failed to delete some entries. Please try again.');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleExport = async (format: 'pdf' | 'markdown' | 'text') => {
    const entriesToExport = selectedEntries.length > 0
      ? filteredEntries.filter((entry) => selectedEntries.includes(entry.id))
      : filteredEntries;

    switch (format) {
      case 'pdf':
        await exportToPdf(entriesToExport, tags);
        break;
      case 'markdown':
        exportToMarkdown(entriesToExport, tags);
        break;
      case 'text':
        exportToText(entriesToExport, tags);
        break;
    }
  };

  const toggleEntrySelection = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((entryId) => entryId !== id) : [...prev, id]
    );
  };

  const toggleAllEntries = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map((entry) => entry.id));
    }
  };

  const renderEntries = () => {
    if (!filteredEntries || filteredEntries.length === 0) {
      return (
        <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
          <p className="text-secondary">No entries found</p>
        </div>
      );
    }

    const layoutProps = {
      entries: filteredEntries,
      tags: tags || [],
      selectedEntries,
      onSelect: toggleEntrySelection,
      onEdit: (id: string) => {
        prefetchEntry(id);
        router.push(`/journal/${id}`);
      },
      onDelete: handleDelete,
      onHover: prefetchEntry, // Add hover handler for prefetching
    };

    switch (layoutMode) {
      case 'grid':
        return <GridLayout {...layoutProps} />;
      case 'compact':
        return <CompactLayout {...layoutProps} />;
      default:
        return <ListLayout {...layoutProps} />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Journal Entries</h1>
              <p className="text-secondary mt-2">
                {filteredEntries.length} of {entries.length} entries
                {lastSyncTime && (
                  <span className="ml-2 text-xs">
                    • Last synced {new Date(lastSyncTime).toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-4 mt-4 sm:mt-0">
              {selectedEntries.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting || entriesLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                  title={`Delete ${selectedEntries.length} selected entries`}
                >
                  <RiDeleteBinLine className={`w-4 h-4 ${deleting ? 'animate-spin' : ''}`} />
                  <span className="text-sm">
                    {deleting ? 'Deleting...' : 'Delete Selected'}
                  </span>
                </button>
              )}
              <ExportMenu
                entries={selectedEntries.length > 0
                  ? filteredEntries.filter((entry) => selectedEntries.includes(entry.id))
                  : filteredEntries}
                tags={tags || []}
                onExport={handleExport}
              />
              {viewMode === 'list' && (
                <LayoutSelector value={layoutMode} onChange={setLayoutMode} />
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={handleRefresh}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* View mode selector */}
                <div className="bg-surface rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">View Mode</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        viewMode === 'list'
                          ? 'bg-primary text-white'
                          : 'bg-surface-hover text-text-primary hover:bg-surface-hover/80'
                      }`}
                    >
                      <RiCheckboxBlankLine className="w-5 h-5" />
                      <span>List View</span>
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        viewMode === 'calendar'
                          ? 'bg-primary text-white'
                          : 'bg-surface-hover text-text-primary hover:bg-surface-hover/80'
                      }`}
                    >
                      <RiCalendarLine className="w-5 h-5" />
                      <span>Calendar View</span>
                    </button>
                    <button
                      onClick={() => setViewMode('analytics')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        viewMode === 'analytics'
                          ? 'bg-primary text-white'
                          : 'bg-surface-hover text-text-primary hover:bg-surface-hover/80'
                      }`}
                    >
                      <RiBarChartLine className="w-5 h-5" />
                      <span>Analytics</span>
                    </button>
                  </div>
                </div>

                {/* Search */}
                <Search onSearch={handleSearch} onResultClick={handleSearchResultClick} />

                {/* Filters */}
                <FilterPanel
                  selectedTags={selectedTags}
                  availableTags={tags || []}
                  onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                  onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                  selectedMoods={selectedMoods}
                  onMoodSelect={(mood) => setSelectedMoods([...selectedMoods, mood])}
                  onMoodRemove={(mood) => setSelectedMoods(selectedMoods.filter(m => m !== mood))}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />

                {/* Bulk actions */}
                {viewMode === 'list' && (
                  <div className="bg-surface rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Bulk Actions</h3>
                    <div className="space-y-3">
                      <button
                        onClick={toggleAllEntries}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-primary hover:bg-surface-hover/80 transition-colors duration-200"
                      >
                        {selectedEntries.length === filteredEntries.length ? (
                          <RiCheckboxBlankLine className="w-4 h-4" />
                        ) : (
                          <RiCheckboxFill className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {selectedEntries.length === filteredEntries.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </span>
                      </button>
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing || entriesLoading}
                        className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-hover text-text-primary hover:bg-surface-hover/80 transition-colors duration-200 disabled:opacity-50"
                      >
                        <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="text-sm">
                          {refreshing ? 'Refreshing...' : 'Refresh'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              {entriesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-secondary">Loading entries...</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-secondary mt-2">
                        Retry attempt {retryCount}/3
                      </p>
                    )}
                  </div>
                </div>
              ) : viewMode === 'analytics' ? (
                <Analytics entries={filteredEntries} />
              ) : viewMode === 'calendar' ? (
                <Calendar
                  entries={filteredEntries.map((entry) => ({
                    id: entry.id,
                    date: entry.date,
                    title: entry.title,
                  }))}
                  onDateSelect={(date) => {
                    const entriesOnDate = filteredEntries.filter(
                      (entry) =>
                        new Date(entry.date).toDateString() === date.toDateString()
                    );
                    if (entriesOnDate.length === 1) {
                      router.push(`/journal/${entriesOnDate[0].id}`);
                    }
                  }}
                />
              ) : (
                renderEntries()
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}