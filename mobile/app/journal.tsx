import { JournalScreen } from '../src/screens/JournalScreen';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { storage, JournalEntry } from '../src/services/storage';

export default function JournalRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry>();

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id]);

  const loadEntry = async (entryId: string) => {
    const loadedEntry = await storage.getEntry(entryId);
    setEntry(loadedEntry || undefined);
  };

  const handleSave = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <JournalScreen
      entry={entry}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
} 