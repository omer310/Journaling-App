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
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
    }
  }, [entry]);

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await storage.getTheme();
      setIsDarkMode(theme === 'dark');
    };
    loadTheme();
  }, []);

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

      if (entry) {
        await storage.updateEntry(newEntry);
      } else {
        await storage.createEntry(newEntry);
      }

      const savedEntry = await storage.getEntry(newEntry.id);
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
      style={[
        styles.container, 
        { paddingTop: insets.top },
        isDarkMode && styles.darkContainer
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSaving} 
          style={styles.headerButton}
        >
          <Text style={[
            styles.headerButtonText, 
            isSaving && styles.disabledText,
            isDarkMode && styles.darkText
          ]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
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

      <TextInput
        style={[styles.titleInput, isDarkMode && styles.darkInput]}
        placeholder="Entry Title"
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        value={title}
        onChangeText={setTitle}
        maxLength={100}
        returnKeyType="next"
      />

      <View style={[styles.toolbar, isDarkMode && styles.darkToolbar]}>
        <TouchableOpacity
          style={[styles.toolbarButton, isBold && styles.toolbarButtonActive]}
          onPress={() => setIsBold(!isBold)}
        >
          <Text style={[styles.toolbarButtonText, isBold && styles.toolbarButtonTextActive]}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, isItalic && styles.toolbarButtonActive]}
          onPress={() => setIsItalic(!isItalic)}
        >
          <Text style={[styles.toolbarButtonText, isItalic && styles.toolbarButtonTextActive]}>I</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          style={[
            styles.contentInput,
            isDarkMode && styles.darkInput,
            isBold && styles.boldText,
            isItalic && styles.italicText,
          ]}
          placeholder="Write your thoughts..."
          placeholderTextColor={isDarkMode ? '#666' : '#999'}
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
    backgroundColor: '#fff', // Light mode background
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
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a', // Light mode text
    padding: 16,
    paddingBottom: 8,
  },
  toolbarButtonText: {
    fontSize: 16,
    color: '#666',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toolbarButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolbarButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  toolbarButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    padding: 16,
    minHeight: 200,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  darkHeader: {
    borderBottomColor: '#2d2d2d',
  },
  darkText: {
    color: '#fff',
  },
  darkInput: {
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
  darkToolbar: {
    backgroundColor: '#2d2d2d',
    borderBottomColor: '#404040',
  },
});