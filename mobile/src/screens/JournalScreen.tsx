import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, JournalEntry } from '../services/storage';

interface Props {
  entry?: JournalEntry;
  onSave: () => void;
  onCancel: () => void;
}

export function JournalScreen({ entry, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
    }
  }, [entry]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your entry');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your entry');
      return;
    }

    setIsSaving(true);
    try {
      const newEntry = {
        id: entry?.id || Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        createdAt: entry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      };

      console.log('Saving entry:', newEntry);
      
      if (entry) {
        await storage.updateEntry(newEntry);
      } else {
        await storage.createEntry(newEntry);
      }

      // Verify the entry was saved
      const savedEntry = await storage.getEntry(newEntry.id);
      console.log('Saved entry:', savedEntry);

      if (savedEntry) {
        onSave();
      } else {
        throw new Error('Entry was not saved successfully');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSaving}
          style={styles.headerButton}
        >
          <Text style={[styles.headerButtonText, isSaving && styles.disabledText]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {entry ? 'Edit Entry' : 'New Entry'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.headerButton, styles.saveButton]}
        >
          <Text
            style={[
              styles.headerButtonText,
              styles.saveButtonText,
              isSaving && styles.disabledText,
            ]}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={styles.titleInput}
          placeholder="Entry Title"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          returnKeyType="next"
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus={!entry}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    padding: 16,
    paddingBottom: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    padding: 16,
    minHeight: 200,
  },
}); 