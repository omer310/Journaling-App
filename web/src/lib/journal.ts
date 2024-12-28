import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry } from '@/types/journal';

const COLLECTION_NAME = 'journal_entries';

export async function createEntry(
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...entry,
    userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateEntry(
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, entryId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEntry(entryId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, entryId);
  await deleteDoc(docRef);
}

export async function getEntry(entryId: string): Promise<JournalEntry | null> {
  const docRef = doc(db, COLLECTION_NAME, entryId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as JournalEntry;
}

export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as JournalEntry;
  });
} 