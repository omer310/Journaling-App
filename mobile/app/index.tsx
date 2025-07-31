import { useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native';

export default function Root() {
  useEffect(() => {
    async function checkInitialRoute() {
      try {
        // Check for existing PIN
        const pin = await SecureStore.getItemAsync('journal_pin');
        
        // If we have a PIN, go to unlock screen, otherwise go to setup
        if (pin) {
          ('Existing PIN found, routing to unlock screen');
          router.replace('/unlock');
        } else {
          ('No PIN found, routing to setup screen');
          router.replace('/setup');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        // Default to setup if there's an error
        router.replace('/setup');
      }
    }

    checkInitialRoute();
  }, []);

  // Show loading spinner while determining initial route
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
} 