import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getFirestore,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { auth } from '@/components/AuthProvider';

const db = getFirestore();

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
      addEntry: async (entry) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const newEntry: Omit<JournalEntry, 'id'> = {
          ...entry,
          userId,
          source: 'web',
          lastModified: new Date().toISOString(),
        };

        try {
          await addDoc(collection(db, 'journal_entries'), newEntry);
        } catch (error) {
          console.error('Error adding entry:', error);
        }
      },
      updateEntry: async (id, entry) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const updatedEntry = {
          ...entry,
          lastModified: new Date().toISOString(),
        };

        try {
          const docRef = doc(db, 'journal_entries', id);
          await updateDoc(docRef, updatedEntry);
        } catch (error) {
          console.error('Error updating entry:', error);
        }
      },
      removeEntry: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
          const docRef = doc(db, 'journal_entries', id);
          await deleteDoc(docRef);
        } catch (error) {
          console.error('Error deleting entry:', error);
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
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
        tags: state.tags,
        pendingSync: state.pendingSync,
      }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            return JSON.parse(str);
          } catch (error) {
            console.warn('Failed to get from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('Failed to save to storage:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.warn('Failed to remove from storage:', error);
          }
        },
      },
    }
  )
);

// Set up Firebase sync
auth.onAuthStateChanged((user) => {
  if (user) {
    // Unsubscribe from previous listener if exists
    let unsubscribe: (() => void) | undefined;

    const setupSync = () => {
      const q = query(
        collection(db, 'journal_entries'),
        where('userId', '==', user.uid)
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const entries: JournalEntry[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            entries.push({
              id: doc.id,
              title: data.title || '',
              content: data.content || '',
              date: data.date || new Date().toISOString(),
              tags: data.tags || [],
              lastModified: data.lastModified || new Date().toISOString(),
              userId: data.userId,
              source: data.source,
            });
          });
          // Sort entries by lastModified in descending order
          entries.sort((a, b) => 
            new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
          );
          useStore.getState().setEntries(entries);
        },
        (error) => {
          console.error('Error fetching entries:', error);
        }
      );
    };

    // Initial setup
    setupSync();

    // Cleanup on user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  } else {
    // Clear entries when user logs out
    useStore.getState().setEntries([]);
  }
}); 