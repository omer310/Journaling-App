import { EntriesScreen } from '../src/screens/EntriesScreen';
import { router } from 'expo-router';
import { JournalEntry } from '../src/services/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

export default function EntriesRoute() {
  const [key, setKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Refresh only when screen comes into focus
      setKey(prev => prev + 1);
    }, [])
  );

  const handleNewEntry = () => {
    router.push('/journal');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    router.push({
      pathname: '/journal',
      params: { id: entry.id }
    });
  };

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  return (
    <EntriesScreen
      key={key}
      onNewEntry={handleNewEntry}
      onEditEntry={handleEditEntry}
      onOpenSettings={handleOpenSettings}
    />
  );
} 