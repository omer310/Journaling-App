import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptData, decryptData, isEncrypted } from '@/lib/encryption';
import { normalizeDateForStorage, normalizeDateForDisplay, normalizeDateForMobileEntry } from '@/lib/dateUtils';
import { getCurrentUserId, requireCurrentUserId } from '@/lib/clientAuthState';

// Create a custom storage that checks for window/localStorage availability
const customStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  lastModified: string;
  userId?: string;
  source?: 'web' | 'mobile';
  mood?: 'happy' | 'neutral' | 'sad';
}

interface RemoteJournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags?: string[];
  user_id: string;
  encryption_user_id?: string;
  source?: 'web' | 'mobile';
  last_modified: string;
  mood?: 'happy' | 'neutral' | 'sad';
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

async function decryptRemoteEntry(entry: RemoteJournalEntry): Promise<JournalEntry> {
  try {
    const [title, content] = await Promise.all([
      isEncrypted(entry.title) ? decryptData(entry.title, entry.encryption_user_id) : Promise.resolve(entry.title),
      isEncrypted(entry.content) ? decryptData(entry.content, entry.encryption_user_id) : Promise.resolve(entry.content)
    ]);

    const normalizedDate = entry.source === 'mobile'
      ? normalizeDateForMobileEntry(entry.date)
      : normalizeDateForStorage(entry.date);

    return {
      id: entry.id,
      title: title || '',
      content: content || '',
      date: normalizedDate,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      lastModified: entry.last_modified,
      userId: entry.user_id,
      source: entry.source,
      mood: entry.mood,
    };
  } catch (error) {
    console.error('Error decrypting entry:', error);
    return {
      id: entry.id,
      title: '[Encrypted Entry]',
      content: 'This entry could not be decrypted. It may have been created with a different encryption method.',
      date: entry.date,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      lastModified: entry.last_modified,
      userId: entry.user_id,
      source: entry.source,
      mood: entry.mood,
    };
  }
}

interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
}

interface AppState {
  // Theme
  currentTheme: string;
  customThemes: Theme[];
  setTheme: (theme: string) => void;
  addCustomTheme: (theme: Theme) => void;
  removeCustomTheme: (themeName: string) => void;

  // Layout preferences
  layoutMode: 'list' | 'grid' | 'compact';
  setLayoutMode: (mode: 'list' | 'grid' | 'compact') => void;

  // UI state
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  editComposerOpen: boolean;
  editEntryId: string | null;
  openEditComposer: (entryId: string) => void;
  closeEditComposer: () => void;

  // Cache management
  cachedEntries: JournalEntry[];
  lastFetchTime: number;
  setCachedEntries: (entries: JournalEntry[]) => void;

  // Tags
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  removeTag: (id: string) => void;

  // Entries
  entries: JournalEntry[];
  entriesLoading: boolean;
  setEntries: (entries: JournalEntry[]) => void;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'lastModified'>) => void;
  updateEntry: (id: string, entry: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
  removeMultipleEntries: (ids: string[]) => Promise<void>;
  fetchEntries: () => Promise<void>;
  
  // Search
  searchEntries: (query: string) => JournalEntry[];
  
  // Offline status
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
  pendingSync: string[];
  addPendingSync: (entryId: string) => void;
  removePendingSync: (entryId: string) => void;
  
  // Sync status
  lastSyncTime: string | null;
  setLastSyncTime: (time: string) => void;
  
  // Data cleanup
  cleanupCorruptedEntries: () => Promise<void>;

  // Background cache refresh
  refreshCacheInBackground: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      currentTheme: 'system',
      customThemes: [],
      setTheme: (theme) => set({ currentTheme: theme }),
      addCustomTheme: (theme) =>
        set((state) => ({
          customThemes: [...state.customThemes, theme],
        })),
      removeCustomTheme: (themeName) =>
        set((state) => ({
          customThemes: state.customThemes.filter((t) => t.name !== themeName),
        })),

      // Layout preferences
      layoutMode: 'list',
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      // UI state
      composerOpen: false,
      openComposer: () => set({ composerOpen: true }),
      closeComposer: () => set({ composerOpen: false }),
      editComposerOpen: false,
      editEntryId: null,
      openEditComposer: (entryId) => set({ editComposerOpen: true, editEntryId: entryId }),
      closeEditComposer: () => set({ editComposerOpen: false, editEntryId: null }),

      // Cache management
      cachedEntries: [],
      lastFetchTime: 0,
      setCachedEntries: (entries) => set({ cachedEntries: entries, lastFetchTime: Date.now() }),

      // Tags
      tags: [],
      addTag: (tag) =>
        set((state) => ({
          tags: [...state.tags, { ...tag, id: crypto.randomUUID() }],
        })),
      updateTag: (id, tag) =>
        set((state) => ({
          tags: state.tags.map((t) => (t.id === id ? { ...t, ...tag } : t)),
        })),
      removeTag: (id) =>
        set((state) => {
          // Remove tag from all entries that have it
          const updatedEntries = state.entries.map(entry => ({
            ...entry,
            tags: entry.tags.filter(tagId => tagId !== id)
          }));

          return {
            tags: state.tags.filter((t) => t.id !== id),
            entries: updatedEntries
          };
        }),

      // Entries
      entries: [],
      entriesLoading: false,
      setEntries: (entries) => set({ entries }),
      fetchEntries: async () => {
        const userId = getCurrentUserId();
        if (!userId) {
          set({ entriesLoading: false });
          return;
        }

        const CACHE_DURATION = 30000; // 30 seconds cache
        const currentTime = Date.now();
        const { lastFetchTime, cachedEntries } = get();

        // Return cached entries if they're fresh
        if (currentTime - lastFetchTime < CACHE_DURATION && cachedEntries.length > 0) {
          set({ entries: cachedEntries });
          
          // Refresh cache in background
          get().refreshCacheInBackground();
          return;
        }

        let retryCount = 0;
        const maxRetries = 3;

        const attemptFetch = async (): Promise<void> => {
          try {
            set({ entriesLoading: true, lastSyncTime: null });

            // OPTIMIZATION: Parallel decryption instead of sequential
            const { entries } = await apiRequest<{ entries: RemoteJournalEntry[] }>('/api/journal/entries');
            const decryptionPromises = entries.map(async (entry) => {
              const entryTags = Array.isArray(entry.tags) ? entry.tags : [];
              const { tags: existingTags } = get();
              const missingTagIds = entryTags.filter((tagId: string) => 
                !existingTags.find(tag => tag.id === tagId)
              );

              // Create missing tag definitions for mobile entries
              if (missingTagIds.length > 0 && entry.source === 'mobile') {
                const newTags = missingTagIds.map((tagId: string) => ({
                  id: tagId,
                  name: `Mobile Tag ${missingTagIds.indexOf(tagId) + 1}`,
                  color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                }));
                
                set((state) => ({
                  tags: [...state.tags, ...newTags]
                }));
              }

              return decryptRemoteEntry(entry);
            });

            // Wait for all decryptions to complete
            const decryptedEntries = await Promise.all(decryptionPromises);

            // Update both cache and current entries
            set({ 
              entries: decryptedEntries, 
              cachedEntries: decryptedEntries,
              lastFetchTime: Date.now(),
              entriesLoading: false,
              lastSyncTime: new Date().toISOString()
            });
          } catch (error: any) {
            console.error(`Error in fetchEntries (attempt ${retryCount + 1}/${maxRetries}):`, error);
            
            if (retryCount < maxRetries - 1) {
              retryCount++;
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              console.log(`Retrying fetch entries in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptFetch();
            }
            
            set({ entriesLoading: false });
            
            // If we have cached entries, use them as fallback
            const { cachedEntries } = get();
            if (cachedEntries.length > 0) {
              console.log('Using cached entries as fallback');
              set({ entries: cachedEntries });
              return;
            }
            
            throw error; // Re-throw the error to be handled by the UI
          }
        };

        return attemptFetch();
      },
      addEntry: async (entry) => {
        try {
          const userId = requireCurrentUserId();

          // Create a temporary ID for optimistic update
          const tempId = crypto.randomUUID();
          const now = new Date().toISOString();

          // Normalize the date to ensure consistent timezone handling
          const normalizedDate = normalizeDateForStorage(entry.date);
          
          // Create optimistic entry for immediate display
          const optimisticEntry: JournalEntry = {
            id: tempId,
            title: entry.title.trim(),
            content: entry.content.trim(),
            date: normalizedDate,
            tags: entry.tags || [],
            lastModified: now,
            userId,
            source: 'web',
            mood: entry.mood,
          };

          // Update local state immediately
          set((state) => ({
            entries: [optimisticEntry, ...state.entries],
            cachedEntries: [optimisticEntry, ...state.cachedEntries],
            lastFetchTime: Date.now(),
            lastSyncTime: now
          }));

          // Create a new entry object without undefined values
          const entryData = {
            title: await encryptData(entry.title.trim()),
            content: await encryptData(entry.content.trim()),
            date: normalizedDate,
            tags: entry.tags || [],
            encryption_user_id: userId,
            source: 'web' as const,
            last_modified: now,
          };

          // Only add mood if it's defined
          if (entry.mood) {
            Object.assign(entryData, { mood: entry.mood });
          }

          const { entry: savedEntry } = await apiRequest<{ entry: RemoteJournalEntry }>('/api/journal/entries', {
            method: 'POST',
            body: JSON.stringify(entryData),
          }).catch((error) => {
            console.error('MongoDB API error:', error);
            // Revert optimistic update on error
            set((state) => ({
              entries: state.entries.filter(e => e.id !== tempId),
              cachedEntries: state.cachedEntries.filter(e => e.id !== tempId)
            }));
            throw error;
          });

          // Update the entry with the real ID from the database
          if (savedEntry) {
            set((state) => ({
              entries: state.entries.map(e => 
                e.id === tempId ? {
                  ...optimisticEntry,
                  id: savedEntry.id,
                  lastModified: savedEntry.last_modified
                } : e
              ),
              cachedEntries: state.cachedEntries.map(e =>
                e.id === tempId ? {
                  ...optimisticEntry,
                  id: savedEntry.id,
                  lastModified: savedEntry.last_modified
                } : e
              )
            }));
          }

          // No need to refresh entries since we already have the latest state
        } catch (error) {
          console.error('Error adding entry:', error);
          throw error;
        }
      },
      updateEntry: async (id, entry) => {
        try {
          requireCurrentUserId();

          const now = new Date().toISOString();

          // Create optimistic update
          const currentState = get();
          const existingEntry = currentState.entries.find(e => e.id === id);
          if (!existingEntry) {
            throw new Error('Entry not found');
          }

          const optimisticEntry = {
            ...existingEntry,
            ...entry,
            lastModified: now
          };

          // Update local state immediately
          set((state) => ({
            entries: state.entries.map(e => e.id === id ? optimisticEntry : e),
            cachedEntries: state.cachedEntries.map(e => e.id === id ? optimisticEntry : e),
            lastFetchTime: Date.now(),
            lastSyncTime: now
          }));

          const updatedEntry: any = {
            last_modified: now,
          };

          // Encrypt fields that need encryption
          if (entry.title !== undefined) {
            updatedEntry.title = await encryptData(entry.title.trim());
            updatedEntry.encryption_user_id = requireCurrentUserId();
          }
          if (entry.content !== undefined) {
            updatedEntry.content = await encryptData(entry.content.trim());
            updatedEntry.encryption_user_id = requireCurrentUserId();
          }

          // Copy other fields as is
          if (entry.tags !== undefined) updatedEntry.tags = entry.tags;
          if (entry.mood !== undefined) updatedEntry.mood = entry.mood;
          if (entry.date !== undefined) updatedEntry.date = normalizeDateForStorage(entry.date);

          await apiRequest<{ entry: RemoteJournalEntry }>(`/api/journal/entries/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updatedEntry),
          }).catch((error) => {
            console.error('MongoDB API error:', error);
            // Revert optimistic update on error
            set((state) => ({
              entries: state.entries.map(e => e.id === id ? existingEntry : e),
              cachedEntries: state.cachedEntries.map(e => e.id === id ? existingEntry : e)
            }));
            throw error;
          });

          // No need to refresh entries since we already have the latest state
        } catch (error) {
          console.error('Error updating entry:', error);
          throw error;
        }
      },
      removeEntry: async (id) => {
        try {
          requireCurrentUserId();

          // Optimistic update - remove from local state immediately
          const currentState = get();
          const entryToDelete = currentState.entries.find(e => e.id === id);
          
          set((state) => ({
            entries: state.entries.filter(e => e.id !== id),
            cachedEntries: state.cachedEntries.filter(e => e.id !== id),
            lastFetchTime: Date.now(),
            lastSyncTime: new Date().toISOString()
          }));

          await apiRequest<{ success: boolean }>(`/api/journal/entries/${id}`, {
            method: 'DELETE',
          }).catch((error) => {
            console.error('MongoDB API error:', error);
            // Revert optimistic update on error
            if (entryToDelete) {
              set((state) => ({
                entries: [entryToDelete, ...state.entries],
                cachedEntries: [entryToDelete, ...state.cachedEntries],
                lastFetchTime: Date.now(),
                lastSyncTime: new Date().toISOString()
              }));
            }
            throw error;
          });

          // Success - no need to refresh entries since we already updated the state
        } catch (error) {
          console.error('Error deleting entry:', error);
          throw error;
        }
      },
      removeMultipleEntries: async (ids) => {
        try {
          requireCurrentUserId();

          // Optimistic update - remove from local state immediately
          const currentState = get();
          const entriesToDelete = currentState.entries.filter(e => ids.includes(e.id));
          
          set((state) => ({
            entries: state.entries.filter(e => !ids.includes(e.id)),
            cachedEntries: state.cachedEntries.filter(e => !ids.includes(e.id)),
            lastFetchTime: Date.now(),
            lastSyncTime: new Date().toISOString()
          }));

          await apiRequest<{ success: boolean }>('/api/journal/entries', {
            method: 'DELETE',
            body: JSON.stringify({ ids }),
          }).catch((error) => {
            console.error('MongoDB API error:', error);
            // Revert optimistic update on error
            set((state) => ({
              entries: [...entriesToDelete, ...state.entries],
              cachedEntries: [...entriesToDelete, ...state.cachedEntries],
              lastFetchTime: Date.now(),
              lastSyncTime: new Date().toISOString()
            }));
            throw error;
          });

          // Success - no need to refresh entries since we already updated the state
        } catch (error) {
          console.error('Error deleting multiple entries:', error);
          throw error;
        }
      },

      // Search
      searchEntries: (query) => {
        const { entries } = get();
        const searchQuery = query.toLowerCase();
        return entries.filter(
          (entry) =>
            entry.title.toLowerCase().includes(searchQuery) ||
            entry.content.toLowerCase().includes(searchQuery)
        );
      },

      // Offline status
      isOffline: false,
      setOfflineStatus: (status) => set({ isOffline: status }),
      pendingSync: [],
      addPendingSync: (entryId) =>
        set((state) => ({
          pendingSync: [...new Set([...state.pendingSync, entryId])],
        })),
      removePendingSync: (entryId) =>
        set((state) => ({
          pendingSync: state.pendingSync.filter((id) => id !== entryId),
        })),
      
      // Sync status
      lastSyncTime: null,
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      
      // Data cleanup
      cleanupCorruptedEntries: async () => {
        try {
          if (!getCurrentUserId()) {
            return;
          }

          const { entries } = await apiRequest<{ entries: RemoteJournalEntry[] }>('/api/journal/entries');

          let cleanedCount = 0;
          for (const entry of entries || []) {
            try {
              // Try to decrypt the entry to see if it's corrupted
              if (entry.title) {
                await decryptData(entry.title);
              }
              if (entry.content) {
                await decryptData(entry.content);
              }
            } catch (error) {
              console.log('Found corrupted entry:', entry.id);
              try {
                await apiRequest<{ success: boolean }>(`/api/journal/entries/${entry.id}`, {
                  method: 'DELETE',
                });
                cleanedCount++;
              } catch (deleteError) {
                console.error('Error deleting corrupted entry:', deleteError);
              }
            }
          }

          console.log(`Cleaned up ${cleanedCount} corrupted entries`);
          
          // Refresh entries after cleanup
          await get().fetchEntries();
        } catch (error) {
          console.error('Error cleaning up corrupted entries:', error);
        }
      },

      // Background cache refresh
      refreshCacheInBackground: async () => {
        try {
          if (!getCurrentUserId()) {
            return;
          }

          const { entries } = await apiRequest<{ entries: RemoteJournalEntry[] }>('/api/journal/entries');
          const decryptedEntries = await Promise.all(entries.map(decryptRemoteEntry));

          // Silently update cache
          set({ 
            cachedEntries: decryptedEntries,
            lastFetchTime: Date.now(),
            lastSyncTime: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error in background refresh:', error);
        }
      },
    }),
    {
      name: 'soul-pages-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
        layoutMode: state.layoutMode,
        tags: state.tags,
        pendingSync: state.pendingSync,
      }),
    }
  )
);

export const setupRealtimeSubscription = async (_userId: string) => undefined;
export const cleanupRealtimeSubscription = () => undefined;
