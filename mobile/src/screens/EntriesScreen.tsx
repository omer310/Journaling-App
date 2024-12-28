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
  }, [loadEntries]);

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

  const renderItem = ({ item }: { item: JournalEntry }) => (
    <Swipeable
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item.id)
      }
      renderLeftActions={(progress, dragX) =>
        renderLeftActions(progress, dragX, item)
      }
      rightThreshold={40}
      leftThreshold={40}
    >
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => onEditEntry(item)}
      >
        <Text style={styles.entryTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.entryDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.entryPreview} numberOfLines={2}>
          {item.content}
        </Text>
        {!item.synced && (
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>Not Synced</Text>
          </View>
        )}
        <Text style={styles.actionHint}>
          ← Swipe to sync • Swipe to delete →
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading entries...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Journal Entries</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={handleSyncAll} 
            style={styles.syncAllButton}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.syncAllButtonText}>↑ Sync All</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onOpenSettings} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNewEntry} style={styles.newButton}>
            <Text style={styles.newButtonText}>New Entry</Text>
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No entries yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Tap the New Entry button to start writing
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#22c55e']}
              tintColor="#22c55e"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncAllButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncAllButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  newButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  list: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
    borderRadius: 12,
  },
  syncButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
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
    marginBottom: 16,
    borderRadius: 12,
  },
  deleteButton: {
    padding: 16,
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
}); 