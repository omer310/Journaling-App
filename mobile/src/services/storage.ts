import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTRIES_KEY = 'journal_entries';
const THEME_KEY = 'app_theme';

export type Theme = 'light' | 'dark';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export const storage = {
  async getAllEntries(): Promise<JournalEntry[]> {
    try {
      const entriesStr = await AsyncStorage.getItem(ENTRIES_KEY);
      return entriesStr ? JSON.parse(entriesStr) : [];
    } catch (error) {
      console.error('Error getting entries:', error);
      return [];
    }
  },

  async getEntry(id: string): Promise<JournalEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Error getting entry:', error);
      return null;
    }
  },

  async createEntry(entry: JournalEntry): Promise<boolean> {
    try {
      const entries = await this.getAllEntries();
      entries.push(entry);
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error creating entry:', error);
      return false;
    }
  },

  async updateEntry(updatedEntry: JournalEntry): Promise<boolean> {
    try {
      const entries = await this.getAllEntries();
      const index = entries.findIndex(entry => entry.id === updatedEntry.id);
      if (index === -1) return false;
      
      entries[index] = updatedEntry;
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      return false;
    }
  },

  async deleteEntry(id: string): Promise<boolean> {
    try {
      const entries = await this.getAllEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filteredEntries));
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      return false;
    }
  },

  async saveEntry(entry: JournalEntry): Promise<boolean> {
    try {
      const existingEntry = await this.getEntry(entry.id);
      if (existingEntry) {
        return this.updateEntry(entry);
      } else {
        return this.createEntry(entry);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      return false;
    }
  },

  async getTheme(): Promise<Theme> {
    try {
      const theme = await AsyncStorage.getItem(THEME_KEY);
      return (theme as Theme) || 'dark';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'dark';
    }
  },

  async setTheme(theme: Theme): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  },
}; 