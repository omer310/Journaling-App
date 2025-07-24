import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTRIES_KEY = 'journal_entries';
const THEME_KEY = 'app_theme';
const TAGS_KEY = 'journal_tags';

export type Theme = 'light' | 'dark';

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  mood?: string;
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

  // Tag management
  async getAllTags(): Promise<Tag[]> {
    try {
      const tagsStr = await AsyncStorage.getItem(TAGS_KEY);
      return tagsStr ? JSON.parse(tagsStr) : [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  },

  async addTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    try {
      const tags = await this.getAllTags();
      const newTag: Tag = {
        ...tag,
        id: this.generateUUID(),
      };
      tags.push(newTag);
      await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(tags));
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  },

  async updateTag(id: string, tag: Partial<Tag>): Promise<boolean> {
    try {
      const tags = await this.getAllTags();
      const index = tags.findIndex(t => t.id === id);
      if (index === -1) return false;
      
      tags[index] = { ...tags[index], ...tag };
      await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(tags));
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      return false;
    }
  },

  async removeTag(id: string): Promise<boolean> {
    try {
      const tags = await this.getAllTags();
      const filteredTags = tags.filter(tag => tag.id !== id);
      await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(filteredTags));
      
      // Also remove this tag from all entries
      const entries = await this.getAllEntries();
      const updatedEntries = entries.map(entry => ({
        ...entry,
        tags: entry.tags.filter(tagId => tagId !== id)
      }));
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries));
      
      return true;
    } catch (error) {
      console.error('Error removing tag:', error);
      return false;
    }
  },

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
}; 