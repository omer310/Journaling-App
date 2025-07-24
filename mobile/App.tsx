import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPINSetup();
    setupDeepLinking();
  }, []);

  const setupDeepLinking = () => {
    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Handle deep links when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription?.remove();
  };

  const handleDeepLink = ({ url }: { url: string }) => {
    // Handle OAuth callback
    if (url.includes('auth/callback')) {
      // The session should be established now, so we can check it
      setTimeout(async () => {
        try {
          await auth.restoreAuthState();
        } catch (error) {
          console.error('Error checking session after OAuth callback:', error);
        }
      }, 1000);
    }
  };

  const checkPINSetup = async () => {
    try {
      const existingPIN = await auth.getPIN();
      setCurrentScreen(existingPIN ? 'unlock' : 'setup');
    } catch (error) {
      console.error('Error checking PIN setup:', error);
      setCurrentScreen('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setCurrentScreen('unlock'); // After setup, go to unlock screen
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

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <SafeAreaProvider>
      {currentScreen === 'setup' && (
        <SetupPINScreen onComplete={handleSetupComplete} />
      )}
      {currentScreen === 'unlock' && (
        <UnlockScreen onUnlock={handleUnlock} />
      )}
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