'use client';

// Disable static generation for this authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
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
  const { entries = [], entriesLoading, tags = [], removeEntry, removeMultipleEntries, removeTag, searchEntries, fetchEntries, lastSyncTime } = useStore();

  // Fetch entries when component mounts
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchEntries();
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
      onEdit: (id: string) => router.push(`/journal/${id}`),
      onDelete: handleDelete,
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-primary">Journal Entries</h1>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || entriesLoading}
                  className="p-2 rounded-lg bg-surface text-secondary hover:text-primary disabled:opacity-50"
                  title="Refresh entries"
                >
                  <RiRefreshLine className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {lastSyncTime && (
                  <div className="text-xs text-secondary">
                    Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                  </div>
                )}
                {viewMode === 'list' && filteredEntries.length > 0 && (
                  <button
                    onClick={toggleAllEntries}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] text-white hover:bg-[#333] transition-colors duration-200"
                  >
                    {selectedEntries.length === filteredEntries.length ? (
                      <RiCheckboxFill className="w-4 h-4 text-[#00ff9d]" />
                    ) : (
                      <RiCheckboxBlankLine className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {selectedEntries.length > 0
                        ? `Selected ${selectedEntries.length}`
                        : 'Select All'}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex gap-4">
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
                <div className="flex gap-1 bg-[#2a2a2a] p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'list'
                        ? 'bg-[#00ff9d] text-black'
                        : 'text-[#888] hover:text-white'
                    }`}
                  >
                    <RiBarChartLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'calendar'
                        ? 'bg-[#00ff9d] text-black'
                        : 'text-[#888] hover:text-white'
                    }`}
                  >
                    <RiCalendarLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      viewMode === 'analytics'
                        ? 'bg-[#00ff9d] text-black'
                        : 'text-[#888] hover:text-white'
                    }`}
                  >
                    <RiBarChartLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Search
                  onSearch={handleSearch}
                  onResultClick={handleSearchResultClick}
                  className="w-full"
                />

                <FilterPanel
                  selectedTags={selectedTags}
                  availableTags={tags || []}
                  onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                  onTagRemove={(tagId) => {
                    setSelectedTags(selectedTags.filter((id) => id !== tagId));
                    removeTag(tagId);
                  }}
                  selectedMoods={selectedMoods}
                  onMoodSelect={(mood) => setSelectedMoods([...selectedMoods, mood])}
                  onMoodRemove={(mood) =>
                    setSelectedMoods(selectedMoods.filter((m) => m !== mood))
                  }
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              <div className="lg:col-span-3">
                {entriesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-secondary">Loading entries...</p>
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
      </div>
    </ProtectedRoute>
  );
} 