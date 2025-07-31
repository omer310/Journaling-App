import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, AppState, Text, AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LockProvider } from "../src/contexts/LockContext";
import { useState, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state change:', appStateRef.current, '->', nextAppState);
      
      // More strict detection - show overlay for ANY transition away from active
      if (appStateRef.current === "active" && (nextAppState === "background" || nextAppState === "inactive")) {
        console.log('Showing privacy overlay - app going to background');
        setShowPrivacyOverlay(true);
      } 
      // Hide overlay only when coming back to active from background/inactive
      else if ((appStateRef.current === "background" || appStateRef.current === "inactive") && nextAppState === "active") {
        console.log('Hiding privacy overlay - app coming to foreground');
        setShowPrivacyOverlay(false);
      }
      // Additional safety: show overlay for any unexpected state changes
      else if (nextAppState !== "active") {
        console.log('Safety: showing privacy overlay for unexpected state:', nextAppState);
        setShowPrivacyOverlay(true);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Also show overlay immediately if app starts in non-active state
    if (AppState.currentState !== "active") {
      console.log('App started in non-active state, showing privacy overlay');
      setShowPrivacyOverlay(true);
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <LockProvider>
      <SafeAreaProvider>
        <StatusBar
          style="light"
          backgroundColor="#1a1a1a"
          translucent={false}
          networkActivityIndicatorVisible={true}
        />
        <GestureHandlerRootView style={styles.container}>
          <View style={styles.container}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
                animation: "fade",
              }}
            />

            {/* Privacy Overlay - Shows when app goes to background */}
            {showPrivacyOverlay && (
              <View style={styles.privacyOverlay}>
                <View style={styles.privacyContent}>
                  <Ionicons name="book-outline" size={80} color="#666" />
                  <Text style={styles.privacyTitle}>Journal</Text>
                  <Text style={styles.privacySubtitle}>
                    Your private thoughts, secured
                  </Text>
                </View>
              </View>
            )}
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </LockProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  privacyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  privacyContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  privacyTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 8,
  },
  privacySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
