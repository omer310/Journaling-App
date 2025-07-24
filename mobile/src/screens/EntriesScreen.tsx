import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, JournalEntry } from '../services/storage';
import { Swipeable } from 'react-native-gesture-handler';
import { sync } from '../services/sync';
import { BottomNavBar } from '../../components/BottomNavBar';

interface Props {
  onEditEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onOpenSettings: () => void;
}

export function EntriesScreen({ onEditEntry, onNewEntry, onOpenSettings }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const insets = useSafeAreaInsets();

  const loadEntries = useCallback(async () => {
    try {
      const allEntries = await storage.getAllEntries();
      console.log('Loaded entries:', allEntries);
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load entries. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const theme = await storage.getTheme();
    setIsDarkMode(theme === 'dark');
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadEntries();
  }, [loadEntries]);

  const handleDeleteEntry = async (id: string) => {
    try {
      await storage.deleteEntry(id);
      await loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete entry. Please try again.');
    }
  };

  const handleSyncEntry = async (entry: JournalEntry) => {
    try {
      await sync.syncEntry(entry);
      await loadEntries();
    } catch (error) {
      console.error('Error syncing entry:', error);
      Alert.alert('Error', 'Failed to sync entry. Please try again.');
    }
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      const unsyncedEntries = entries.filter(entry => !entry.synced);
      
      if (unsyncedEntries.length === 0) {
        Alert.alert('Info', 'All entries are already synced!');
        return;
      }

      await sync.syncAllEntries();
      await loadEntries();
      Alert.alert('Success', 'All entries have been synced!');
    } catch (error) {
      console.error('Error syncing all entries:', error);
      Alert.alert('Error', 'Failed to sync entries. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    entry: JournalEntry
  ) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [-20, 0, 0],
    });

    return (
      <Animated.View
        style={[
          styles.syncAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleSyncEntry(entry)}
          style={styles.syncButton}
          disabled={entry.synced}
        >
          <Text style={styles.syncButtonText}>
            {entry.synced ? 'Synced ✓' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
    id: string
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [64, 0],
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleDeleteEntry(id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading entries...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.darkContainer,
    ]}>
      <View style={[
        styles.header,
        { paddingTop: insets.top + 16 },
        isDarkMode && styles.darkHeader
      ]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>My Journal</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, isDarkMode && styles.darkText]}>No entries yet</Text>
          <Text style={[styles.emptyStateSubtext, isDarkMode && styles.darkSecondaryText]}>
            Tap the New Entry button to start writing
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={(progress, dragX) =>
                renderRightActions(progress, dragX, item.id)
              }
              renderLeftActions={(progress, dragX) =>
                renderLeftActions(progress, dragX, item)
              }
              rightThreshold={40}
              leftThreshold={40}
              containerStyle={styles.swipeableContainer}
            >
              <TouchableOpacity
                style={[styles.entryCard, isDarkMode && styles.darkEntryCard]}
                onPress={() => onEditEntry(item)}
              >
                <Text style={[styles.entryTitle, isDarkMode && styles.darkText]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.entryDate, isDarkMode && styles.darkSecondaryText]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text style={[styles.entryPreview, isDarkMode && styles.darkText]} numberOfLines={2}>
                  {item.content}
                </Text>
                {!item.synced && (
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncBadgeText}>Not Synced</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Swipeable>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#22c55e']}
              tintColor={isDarkMode ? '#22c55e' : '#22c55e'}
            />
          }
        />
      )}

      <BottomNavBar
        onSync={handleSyncAll}
        onNewEntry={onNewEntry}
        onSettings={onOpenSettings}
        isSyncing={isSyncing}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#a1a1aa',
  },
  darkEntryCard: {
    backgroundColor: '#2d2d2d',
    borderColor: '#404040',
  },
  list: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  entryPreview: {
    fontSize: 16,
    color: '#4a4a4a',
    lineHeight: 22,
  },
  syncBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    fontSize: 12,
    color: '#92400e',
  },
  actionHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  syncAction: {
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderRadius: 12,
    height: '100%',
    width: 100,
  },
  syncButton: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: 12,
    height: '100%',
    width: 100,
  },
  deleteButton: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  swipeableContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
}); 