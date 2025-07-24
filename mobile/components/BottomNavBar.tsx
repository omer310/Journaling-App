import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSync: () => void;
  onNewEntry: () => void;
  onSettings: () => void;
  isSyncing?: boolean;
  isDarkMode?: boolean;
}

export function BottomNavBar({ 
  onSync, 
  onNewEntry, 
  onSettings, 
  isSyncing = false, 
  isDarkMode = false 
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.darkContainer,
      { paddingBottom: insets.bottom + 16 }
    ]}>
      <View style={styles.navContent}>
        <TouchableOpacity
          style={[styles.navButton, isDarkMode && styles.darkNavButton]}
          onPress={onSync}
          disabled={isSyncing}
          activeOpacity={0.7}
        >
          <View style={styles.navButtonContent}>
            {isSyncing ? (
              <ActivityIndicator color={isDarkMode ? '#4f46e5' : '#4f46e5'} size="small" />
            ) : (
              <Ionicons 
                name="cloud-upload-outline" 
                size={24} 
                color={isDarkMode ? '#4f46e5' : '#4f46e5'} 
              />
            )}
            <Text style={[
              styles.navButtonText, 
              isDarkMode && styles.darkNavButtonText,
              isSyncing && styles.syncingText
            ]}>
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, isDarkMode && styles.darkPrimaryButton]}
          onPress={onNewEntry}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={38} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, isDarkMode && styles.darkNavButton]}
          onPress={onSettings}
          activeOpacity={0.7}
        >
          <View style={styles.navButtonContent}>
            <Ionicons 
              name="settings-outline" 
              size={24} 
              color={isDarkMode ? '#a1a1aa' : '#64748b'} 
            />
            <Text style={[styles.navButtonText, isDarkMode && styles.darkNavButtonText]}>
              Settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#2d2d2d',
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginHorizontal: 8,
  },
  darkNavButton: {
    backgroundColor: '#2d2d2d',
  },
  navButtonContent: {
    alignItems: 'center',
    gap: 4,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  darkNavButtonText: {
    color: '#a1a1aa',
  },
  syncingText: {
    color: '#4f46e5',
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: 35,
    width: 70,
    height: 70,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  darkPrimaryButton: {
    backgroundColor: '#16a34a',
  },
}); 