import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { encryptData, decryptData, isEncrypted } from '@/lib/encryption';

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

  // Tags
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  removeTag: (id: string) => void;

  // Entries
  entries: JournalEntry[];
  setEntries: (entries: JournalEntry[]) => void;
  addEntry: (entry: Omit<JournalEntry, 'id' | 'lastModified'>) => void;
  updateEntry: (id: string, entry: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
  fetchEntries: () => Promise<void>;
  
  // Search
  searchEntries: (query: string) => JournalEntry[];
  
  // Offline status
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
  pendingSync: string[];
  addPendingSync: (entryId: string) => void;
  removePendingSync: (entryId: string) => void;
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
      setEntries: (entries) => set({ entries }),
      fetchEntries: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('No user authenticated, skipping fetch');
            return;
          }

          const { data: entries, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('last_modified', { ascending: false });

          if (error) {
            console.error('Error fetching entries:', error);
            return;
          }

          const decryptedEntries: JournalEntry[] = [];
          for (const entry of entries) {
            try {
              // Decrypt the title and content if they're encrypted
              const title = isEncrypted(entry.title) ? await decryptData(entry.title) : entry.title;
              const content = isEncrypted(entry.content) ? await decryptData(entry.content) : entry.content;

              decryptedEntries.push({
                id: entry.id,
                title: title || '',
                content: content || '',
                date: entry.date,
                tags: entry.tags || [],
                lastModified: entry.last_modified,
                userId: entry.user_id,
                source: entry.source,
                mood: entry.mood,
              });
            } catch (error) {
              console.error('Error decrypting entry:', error);
              // Skip this entry if decryption fails
              continue;
            }
          }

          set({ entries: decryptedEntries });
        } catch (error) {
          console.error('Error in fetchEntries:', error);
        }
      },
      addEntry: async (entry) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Create a new entry object without undefined values
          const entryData = {
            title: await encryptData(entry.title.trim()),
            content: await encryptData(entry.content.trim()),
            date: entry.date,
            tags: entry.tags || [],
            user_id: user.id,
            source: 'web' as const,
            last_modified: new Date().toISOString(),
          };

          // Only add mood if it's defined
          if (entry.mood) {
            Object.assign(entryData, { mood: entry.mood });
          }

          const { error } = await supabase
            .from('journal_entries')
            .insert(entryData);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          // Refresh entries after adding
          await get().fetchEntries();
        } catch (error) {
          console.error('Error adding entry:', error);
          throw error;
        }
      },
      updateEntry: async (id, entry) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const updatedEntry: any = {
            last_modified: new Date().toISOString(),
          };

          // Encrypt fields that need encryption
          if (entry.title !== undefined) {
            updatedEntry.title = await encryptData(entry.title.trim());
          }
          if (entry.content !== undefined) {
            updatedEntry.content = await encryptData(entry.content.trim());
          }

          // Copy other fields as is
          if (entry.tags !== undefined) updatedEntry.tags = entry.tags;
          if (entry.mood !== undefined) updatedEntry.mood = entry.mood;
          if (entry.date !== undefined) updatedEntry.date = entry.date;

          const { error } = await supabase
            .from('journal_entries')
            .update(updatedEntry)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          // Refresh entries after updating
          await get().fetchEntries();
        } catch (error) {
          console.error('Error updating entry:', error);
          throw error;
        }
      },
      removeEntry: async (id) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }

          // Refresh entries after deleting
          await get().fetchEntries();
        } catch (error) {
          console.error('Error deleting entry:', error);
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
    }),
    {
      name: 'soul-pages-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
        tags: state.tags,
        pendingSync: state.pendingSync,
      }),
    }
  )
);

// Set up Supabase sync
let currentChannel: any = null;

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event, session?.user?.email);
  
  if (session?.user) {
    // Fetch initial entries
    await useStore.getState().fetchEntries();

    // Set up real-time subscription
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
    }

    currentChannel = supabase
      .channel('journal_entries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          console.log('Real-time update:', payload);
          
          // Refetch all entries to ensure consistency
          await useStore.getState().fetchEntries();
        }
      )
      .subscribe();
  } else {
    console.log('User logged out, clearing data...');
    // Clear entries when user logs out
    useStore.getState().setEntries([]);
    
    // Clean up channel
    if (currentChannel) {
      supabase.removeChannel(currentChannel);
      currentChannel = null;
    }
  }
}); 