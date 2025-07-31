import { supabase } from '../config/supabase';
import { storage, JournalEntry, Tag } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData } from '../lib/encryption';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export const sync = {
  async getOAuthRedirectUri() {
    try {
      // Use Linking.createURL to get the proper scheme for current environment
      const linkingUrl = Linking.createURL('auth/callback');

      
      // Check if it's a development URI (exp:// scheme)
      if (linkingUrl.startsWith('exp://')) {
        ('🔄 Development build detected, using mobile scheme for OAuth');
        
        // For development, use the production scheme which Google accepts
        const mobileScheme = 'soulpages://auth/callback';
        return mobileScheme;
      }
      
      return linkingUrl;
    } catch (error) {
      console.error('Error getting OAuth redirect URI:', error);
      // Fallback to production scheme
      return 'soulpages://auth/callback';
    }
  },

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
      // Get the proper redirect URI for the current environment
      const redirectUri = await this.getOAuthRedirectUri();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
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

      // For development builds using Supabase callback, wait longer for OAuth completion
      const isDevelopment = (await this.getOAuthRedirectUri()).includes('supabase.co');
      const waitTime = isDevelopment ? 10000 : 5000; // Wait longer for development
      
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Try to get the session multiple times
      let session = null;
      const maxRetries = isDevelopment ? 5 : 3; // More retries for development
      
      for (let i = 0; i < maxRetries; i++) {
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
          (`Entry ${entry.id} not found on server, creating new entry`);
          const { data, error } = await supabase
            .from('journal_entries')
            .insert(supabaseEntry)
            .select()
            .single();
          
          if (error) throw error;
          result = data;
        } else {
          // Entry exists, update it
          (`Updating existing entry ${entry.id} on server`);
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

      const localEntries = await storage.getAllEntries();
      
      // Only upload unsynced local entries to web (push-only sync)
      for (const entry of localEntries) {
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