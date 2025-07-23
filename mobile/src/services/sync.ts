import { supabase } from '../config/supabase';
import { storage, JournalEntry } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData } from '../lib/encryption';

export const sync = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Store auth state in AsyncStorage
      if (data.user) {
        await AsyncStorage.setItem('auth_user', JSON.stringify({
          uid: data.user.id,
          email: data.user.email,
        }));
      }

      return data.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async syncEntry(entry: JournalEntry) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not signed in');
      }

      const userId = user.id;
      
      // Encrypt title and content
      const encryptedTitle = await encryptData(entry.title);
      const encryptedContent = await encryptData(entry.content);
      
      // Convert entry to Supabase format
      const supabaseEntry = {
        title: encryptedTitle,
        content: encryptedContent,
        date: entry.date,
        tags: entry.tags || [],
        user_id: userId,
        source: 'mobile' as const,
        last_modified: new Date().toISOString(),
        mood: entry.mood || null,
      };

      // Always insert new entry (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('journal_entries')
        .insert(supabaseEntry)
        .select()
        .single();
      
      if (error) throw error;
      const result = data;

      // Update local entry with the server-generated ID and mark as synced
      const updatedEntry = { ...entry, id: result.id, synced: true };
      
      // Delete the old entry first, then save the new one
      await storage.deleteEntry(entry.id);
      await storage.saveEntry(updatedEntry);
      
      return true;
    } catch (error) {
      console.error('Error syncing entry:', error);
      throw error;
    }
  },

  async syncAllEntries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not signed in');
      }

      const userId = user.id;
      const entries = await storage.getAllEntries();
      
      // Upload only unsynced local entries to web
      for (const entry of entries) {
        if (!entry.synced) {
          await this.syncEntry(entry);
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing all entries:', error);
      throw error;
    }
  },





  async restoreAuthState() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return {
          uid: session.user.id,
          email: session.user.email,
        };
      }

      // Fallback to AsyncStorage for backward compatibility
      const authUser = await AsyncStorage.getItem('auth_user');
      return authUser ? JSON.parse(authUser) : null;
    } catch (error) {
      console.error('Error restoring auth state:', error);
      return null;
    }
  },
}; 