import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { auth } from '../src/services/auth';
import { sync } from '../src/services/sync';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export default function Layout() {
  useEffect(() => {
    const signInWithStoredCredentials = async () => {
      try {
        // First try to restore Firebase auth state
        const authUser = await sync.restoreAuthState();
        if (authUser) {
          // Get stored web credentials
          const credentials = await auth.getWebCredentials();
          if (credentials) {
            // Re-authenticate with Firebase
            await signInWithEmailAndPassword(
              getAuth(),
              credentials.email,
              credentials.password
            );
          }
        }
      } catch (error) {
        console.error('Error signing in with stored credentials:', error);
      }
    };

    signInWithStoredCredentials();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
