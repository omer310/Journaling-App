import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupPINScreen } from './src/screens/SetupPINScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { EntriesScreen } from './src/screens/EntriesScreen';
import { auth } from './src/services/auth';
import { JournalEntry } from './src/services/storage';

type Screen = 'setup' | 'unlock' | 'entries' | 'journal' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('unlock');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | undefined>();

  useEffect(() => {
    checkPINSetup();
  }, []);

  const checkPINSetup = async () => {
    try {
      const credentials = await auth.verifyPIN('');
      setCurrentScreen(credentials ? 'unlock' : 'setup');
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      setCurrentScreen('setup');
    }
  };

  const handleSetupComplete = () => {
    setCurrentScreen('entries');
  };

  const handleUnlock = () => {
    setCurrentScreen('entries');
  };

  const handleNewEntry = () => {
    setSelectedEntry(undefined);
    setCurrentScreen('journal');
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setCurrentScreen('journal');
  };

  const handleSaveEntry = () => {
    setCurrentScreen('entries');
  };

  const handleCancelEntry = () => {
    setCurrentScreen('entries');
  };

  return (
    <SafeAreaProvider>
      {currentScreen === 'setup' && (
        <SetupPINScreen onComplete={handleSetupComplete} />
      )}
      {currentScreen === 'unlock' && <UnlockScreen onUnlock={handleUnlock} />}
      {currentScreen === 'entries' && (
        <EntriesScreen 
          onNewEntry={handleNewEntry} 
          onEditEntry={handleEditEntry}
          onOpenSettings={() => setCurrentScreen('settings')}
        />
      )}
      {currentScreen === 'journal' && (
        <JournalScreen
          entry={selectedEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelEntry}
        />
      )}
    </SafeAreaProvider>
  );
} 