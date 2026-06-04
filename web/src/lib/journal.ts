import { JournalEntry } from '@/types/journal';

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

function mapEntry(entry: any): JournalEntry {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    date: entry.date,
    tags: entry.tags || [],
    mood: entry.mood,
    createdAt: new Date(entry.created_at),
    updatedAt: new Date(entry.updated_at),
    userId: entry.user_id,
    source: entry.source,
  };
}

export async function createEntry(
  _userId: string,
  entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'source'>
): Promise<string> {
  const { entry: createdEntry } = await apiRequest<{ entry: any }>('/api/journal/entries', {
    method: 'POST',
    body: JSON.stringify({
      ...entry,
      source: 'web',
    }),
  });

  return createdEntry.id;
}

export async function updateEntry(
  entryId: string,
  updates: Partial<Omit<JournalEntry, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  await apiRequest(`/api/journal/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteEntry(entryId: string): Promise<void> {
  await apiRequest(`/api/journal/entries/${entryId}`, {
    method: 'DELETE',
  });
}

export async function getEntry(entryId: string): Promise<JournalEntry | null> {
  try {
    const { entry } = await apiRequest<{ entry: any }>(`/api/journal/entries/${entryId}`);
    return mapEntry(entry);
  } catch {
    return null;
  }
}

export async function getUserEntries(_userId: string): Promise<JournalEntry[]> {
  const { entries } = await apiRequest<{ entries: any[] }>('/api/journal/entries');
  return entries.map(mapEntry);
}
