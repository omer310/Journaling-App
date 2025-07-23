import { supabase } from './supabase';
import { JournalEntry } from '@/types/journal';

const TABLE_NAME = 'journal_entries';

export async function createEntry(
  userId: string,
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'source'>
): Promise<string> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      ...entry,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'web',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateEntry(
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId);

  if (error) {
    throw error;
  }
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', entryId);

  if (error) {
    throw error;
  }
}

export async function getEntry(entryId: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', entryId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    date: data.date,
    tags: data.tags || [],
    mood: data.mood,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
    source: data.source,
  } as JournalEntry;
}

export async function getUserEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    date: entry.date,
    tags: entry.tags || [],
    mood: entry.mood,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    userId: entry.user_id,
    source: entry.source,
  } as JournalEntry));
} 