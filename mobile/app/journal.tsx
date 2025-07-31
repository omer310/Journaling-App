import { JournalScreen } from '../src/screens/JournalScreen';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { storage, JournalEntry } from '../src/services/storage';

export default function JournalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry>();
  const [isLoading, setIsLoading] = useState(!!id); // Loading if we have an ID

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id]);

  const loadEntry = async (entryId: string) => {
    setIsLoading(true);
    const loadedEntry = await storage.getEntry(entryId);
    setEntry(loadedEntry || undefined);
    setIsLoading(false);
  };

  const handleSave = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  // Don't render the JournalScreen until we know if we have an entry or not
  if (isLoading) {
    return null; // or a loading spinner if you prefer
  }

  return (
    <JournalScreen
      entry={entry}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
} 