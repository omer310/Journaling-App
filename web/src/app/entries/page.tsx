'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { Search } from '@/components/Search';
import { Tags } from '@/components/Tags';
import { useStore } from '@/store/useStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  RiCalendarLine,
  RiListUnordered,
  RiEdit2Line,
  RiDeleteBinLine,
} from 'react-icons/ri';

type ViewMode = 'list' | 'calendar';

export default function EntriesPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { entries, tags, removeEntry, searchEntries } = useStore();

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

  const filteredEntries = entries.filter((entry) =>
    selectedTags.length === 0
      ? true
      : selectedTags.every((tagId) => entry.tags.includes(tagId))
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      removeEntry(id);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h1 className="text-3xl font-bold text-primary">Journal Entries</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <RiListUnordered className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'calendar'
                      ? 'bg-primary text-white'
                      : 'bg-surface text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <RiCalendarLine className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Search
                  onSearch={handleSearch}
                  onResultClick={handleSearchResultClick}
                  className="w-full"
                />

                <div className="bg-surface rounded-xl shadow-lg p-6">
                  <h2 className="text-lg font-semibold text-primary mb-4">
                    Filter by Tags
                  </h2>
                  <Tags
                    selectedTags={selectedTags}
                    availableTags={tags}
                    onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
                    onTagRemove={(tagId) =>
                      setSelectedTags(selectedTags.filter((id) => id !== tagId))
                    }
                  />
                </div>
              </div>

              <div className="lg:col-span-3">
                {viewMode === 'calendar' ? (
                  <Calendar
                    entries={entries.map((entry) => ({
                      id: entry.id,
                      date: entry.date,
                      title: entry.title,
                    }))}
                    onDateSelect={(date) => {
                      const entriesOnDate = entries.filter(
                        (entry) =>
                          new Date(entry.date).toDateString() === date.toDateString()
                      );
                      if (entriesOnDate.length === 1) {
                        router.push(`/journal/${entriesOnDate[0].id}`);
                      }
                      // If multiple entries, we could show a modal or expand the list view
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.length === 0 ? (
                      <div className="bg-surface rounded-xl shadow-lg p-6 text-center">
                        <p className="text-secondary">No entries found</p>
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-surface rounded-xl shadow-lg p-6"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-semibold text-primary mb-2">
                                {entry.title}
                              </h2>
                              <p className="text-sm text-secondary mb-4">
                                {new Date(entry.date).toLocaleDateString()} at{' '}
                                {new Date(entry.date).toLocaleTimeString()}
                              </p>
                              <div
                                className="prose dark:prose-invert line-clamp-3"
                                dangerouslySetInnerHTML={{ __html: entry.content }}
                              />
                              {entry.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {entry.tags.map((tagId) => {
                                    const tag = tags.find((t) => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span
                                        key={tag.id}
                                        className="tag"
                                        style={
                                          tag.color
                                            ? {
                                                borderColor: tag.color,
                                                color: tag.color,
                                              }
                                            : undefined
                                        }
                                      >
                                        {tag.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/journal/${entry.id}`)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                                title="Edit entry"
                              >
                                <RiEdit2Line className="w-5 h-5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                title="Delete entry"
                              >
                                <RiDeleteBinLine className="w-5 h-5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 