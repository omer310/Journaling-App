import { Stack, SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Check for existing PIN
        const pin = await SecureStore.getItemAsync('journal_pin');
        
        // If we have a PIN, go to unlock screen, otherwise go to setup
        if (pin) {
          console.log('Existing PIN found, routing to unlock screen');
          setInitialRoute('unlock');
        } else {
          console.log('No PIN found, routing to setup screen');
          setInitialRoute('setup');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        // Default to setup if there's an error
        setInitialRoute('setup');
      } finally {
        // Hide the splash screen once we're done
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  // While the app is loading, show nothing
  if (!initialRoute) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <Stack
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade',
            }}
          />
        </View>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
