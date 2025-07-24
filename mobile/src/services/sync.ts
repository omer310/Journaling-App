import { supabase } from '../config/supabase';
import { storage, JournalEntry, Tag } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData } from '../lib/encryption';
import * as Linking from 'expo-linking';

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

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'soulpages://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const supported = await Linking.canOpenURL(data.url);
        
        if (supported) {
          await Linking.openURL(data.url);
        } else {
          throw new Error('Cannot open OAuth URL in browser');
        }
      } else {
        throw new Error('No OAuth URL received from Supabase');
      }

      // Wait for redirect completion
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Try to get the session multiple times
      let session = null;
      for (let i = 0; i < 3; i++) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          session = currentSession;
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (session?.user) {
        // Store auth state in AsyncStorage
        await AsyncStorage.setItem('auth_user', JSON.stringify({
          uid: session.user.id,
          email: session.user.email,
        }));
        
        return {
          user: session.user,
          session: session
        };
      } else {
        throw new Error('No session established after Google sign-in. Please try again.');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
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

      let result;
      
      // Check if entry already exists on server (has a server ID)
      if (entry.id && entry.id.length > 20) { // Server IDs are UUIDs (36 chars), local IDs are shorter
        // First, check if the entry actually exists on the server
        const { data: existingEntry, error: checkError } = await supabase
          .from('journal_entries')
          .select('id')
          .eq('id', entry.id)
          .eq('user_id', userId)
          .single();

        if (checkError || !existingEntry) {
          // Entry doesn't exist on server, treat as new entry
          console.log(`Entry ${entry.id} not found on server, creating new entry`);
          const { data, error } = await supabase
            .from('journal_entries')
            .insert(supabaseEntry)
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        } else {
          // Entry exists, update it
          console.log(`Updating existing entry ${entry.id} on server`);
          const { data, error } = await supabase
            .from('journal_entries')
            .update(supabaseEntry)
            .eq('id', entry.id)
            .eq('user_id', userId)
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        }
      } else {
        // Insert new entry
        const { data, error } = await supabase
          .from('journal_entries')
          .insert(supabaseEntry)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

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
      const localEntries = await storage.getAllEntries();
      
      // First, fetch all entries from server
      const { data: serverEntries, error: fetchError } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Create a map of server entries by ID for quick lookup
      const serverEntriesMap = new Map();
      serverEntries?.forEach(entry => {
        serverEntriesMap.set(entry.id, entry);
      });

      // Upload unsynced local entries to web
      for (const entry of localEntries) {
        if (!entry.synced) {
          await this.syncEntry(entry);
        }
      }

      // Download entries that exist on server but not locally
      for (const serverEntry of serverEntries || []) {
        const localEntry = localEntries.find(e => e.id === serverEntry.id);
        if (!localEntry) {
          // Entry exists on server but not locally - download it
          await this.downloadEntry(serverEntry);
        }
      }

      // Handle orphaned entries (exist locally but not on server)
      for (const localEntry of localEntries) {
        if (localEntry.id && localEntry.id.length > 20 && !serverEntriesMap.has(localEntry.id)) {
          console.log(`Found orphaned entry ${localEntry.id}, marking as unsynced`);
          // Mark orphaned entry as unsynced so it gets re-created
          await storage.updateEntry({ ...localEntry, synced: false });
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing all entries:', error);
      throw error;
    }
  },

  async downloadEntry(serverEntry: any) {
    try {
      // Decrypt title and content
      const decryptedTitle = await decryptData(serverEntry.title);
      const decryptedContent = await decryptData(serverEntry.content);
      
      // Convert to local format
      const localEntry: JournalEntry = {
        id: serverEntry.id,
        title: decryptedTitle,
        content: decryptedContent,
        date: serverEntry.date,
        tags: serverEntry.tags || [],
        synced: true,
        createdAt: serverEntry.created_at,
        updatedAt: serverEntry.updated_at,
        mood: serverEntry.mood,
      };

      // Save to local storage
      await storage.saveEntry(localEntry);
      
      return localEntry;
    } catch (error) {
      console.error('Error downloading entry:', error);
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