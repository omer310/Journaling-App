import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  initializeFirestore
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { storage, JournalEntry } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with proper persistence
const auth = getApps().length === 0 
  ? initializeAuth(app, {
      persistence: indexedDBLocalPersistence
    })
  : getAuth(app);

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const sync = {
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Store auth state in AsyncStorage
      await AsyncStorage.setItem('auth_user', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      }));
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  async syncEntry(entry: JournalEntry) {
    try {
      if (!auth.currentUser) {
        throw new Error('Not signed in');
      }

      const userId = auth.currentUser.uid;
      const entryRef = doc(db, 'journal_entries', entry.id);
      
      await setDoc(entryRef, {
        ...entry,
        userId,
        updatedAt: Timestamp.fromDate(new Date(entry.updatedAt)),
        createdAt: Timestamp.fromDate(new Date(entry.createdAt)),
        source: 'mobile',
      });

      // Mark entry as synced
      await storage.saveEntry({ ...entry, synced: true });
      return true;
    } catch (error) {
      console.error('Error syncing entry:', error);
      throw error;
    }
  },

  async syncAllEntries() {
    try {
      if (!auth.currentUser) {
        throw new Error('Not signed in');
      }

      const userId = auth.currentUser.uid;
      const entries = await storage.getAllEntries();
      
      // Upload local entries
      for (const entry of entries) {
        if (!entry.synced) {
          await this.syncEntry(entry);
        }
      }

      // Download remote entries
      const entriesRef = collection(db, 'journal_entries');
      const q = query(
        entriesRef,
        where('userId', '==', userId),
        where('updatedAt', '>', Timestamp.fromDate(new Date(0)))
      );
      const querySnapshot = await getDocs(q);

      const remoteEntries: JournalEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        remoteEntries.push({
          ...data,
          id: doc.id,
          updatedAt: data.updatedAt.toDate().toISOString(),
          createdAt: data.createdAt.toDate().toISOString(),
          synced: true,
        } as JournalEntry);
      });

      // Merge remote entries with local entries
      for (const remoteEntry of remoteEntries) {
        const localEntry = entries.find(e => e.id === remoteEntry.id);
        if (!localEntry || new Date(localEntry.updatedAt) < new Date(remoteEntry.updatedAt)) {
          await storage.saveEntry(remoteEntry);
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
      const authUser = await AsyncStorage.getItem('auth_user');
      return authUser ? JSON.parse(authUser) : null;
    } catch (error) {
      console.error('Error restoring auth state:', error);
      return null;
    }
  },
}; 